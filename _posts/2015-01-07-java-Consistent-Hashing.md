---
layout: default
title:  Consistent Hashing
categories:
  - java

---
# {{ page.title }}

##1. 原理

在分布式系统中，如果某业务可以由多个相同的节点处理，很容易想到用HASH的方式将业务请求分散到这些节点处理，如果有N个节点，计算方法为：HASH（id）% N。
如果只是简单的计算，不涉及用户状态，这是一个简单有效的方案。如果节点的计算涉及用户状态，比如维护购物车、Memcache缓存服务等，好像也没什么问题，只要用同一个数据做id，上述HASH的结果也保持不变。但如果节点数量发生变化，比如由于业务量的增大而增加节点或由于机器宕机而减少节点，上述HASH的结果就不一样了。若增加2个节点，某id原处理节点为HASH（id）% N，新的处理节点就变成了HASH（id）% （N + 2），可能会将大量id的处理节点打乱重新分配，就会发现之前某节点保存的用户数据用不到了，而新的处理节点根本没有这些数据。在这段时间内，这些用户的状态受到破坏，如果是购物车，车里的东西都没了，如果是缓存服务，之前的缓存都消失了，起不到缓存的效果。可能需要用户重新登录，可能需要从数据库更新缓存，可能由此引入新的问题。
一致性哈希在一定程度上缓解了这个问题，步骤为：
    1.将整个哈希值空间组织成一个虚拟圆环，假设某哈希函数H的值空间为0-(2^32-1)，即32位无符号整数
    2.将各节点用H函数哈希，可以将服务器的IP或主机名作为关键字哈希，这样每个节点就能确定其在哈希环上的位置
    3.将id用H函数映射到哈希空间的一个值，沿该值向后，将遇到的第一个节点做为处理节点 
下图中，若某id的HASH值落在node1和node2各自HASH值的中间位置，则此id对应的业务请求由node2处理。

![大概的类图](/blog/image/hash1.png)

当增加服务节点时，只会影响与之相邻的某一节点，其他节点不受影响。如果在node2和node4之间增加一个node5，则只有node4处理的部分id（HASH值落在node2之后、node5之前的那部分id）变为由node5来处理，其他节点处理的id不变。比开头所述的简单HASH方式有了很大的改善。

![大概的类图](/blog/image/hash2.jpeg)

如果节点数不多，将这些节点映射到值空间之后，分布可能会很不均匀，必然会造成个别节点处理的id数量远大于其他节点，这就起不到负载均衡的效果。这可以通过引入虚拟节点的方式解决，即对每一个节点计算多个HASH值，尽量保证这些HASH值比较均匀的分布在值空间中。当根据id查找节点时，找到的是虚拟节点，然后再根据虚拟节点查找对应的真实节点。多了一次查找的过程。
Memcached的客户端库libmemcached已经支持此算法。

##2. 代码

    import java.util.Collection;
    import java.util.SortedMap;
    import java.util.TreeMap;
    
    public class ConsistentHash<T> {
    
     //hash算法，这个算法能保证最后分布均匀
     private final HashFunction hashFunction;
     //每个节点重复多少次，如果把一个换认为是 0~2^32-1 次方个位置，位置上都可以放节点，则几个节点可以对应一个机器
     private final int numberOfReplicas;
     //节点信息，按照什么顺序排序不重要，重要的是key是一个整形，并且是顺序排列的，能快速找到下一个节点
     private final SortedMap<Integer, T> circle = new TreeMap<Integer, T>();
    
     public ConsistentHash(HashFunction hashFunction, int numberOfReplicas,
         Collection<T> nodes) {
       this.hashFunction = hashFunction;
       this.numberOfReplicas = numberOfReplicas;
    
       for (T node : nodes) {
         add(node);
       }
     }
    
     public void add(T node) {
       for (int i = 0; i < numberOfReplicas; i++) {
         circle.put(hashFunction.hash(node.toString() + i), node);
       }
     }
    
     public void remove(T node) {
       for (int i = 0; i < numberOfReplicas; i++) {
         circle.remove(hashFunction.hash(node.toString() + i));
       }
     }
    
     public T get(Object key) {
       if (circle.isEmpty()) {
         return null;
       }
       int hash = hashFunction.hash(key);
       //查找最近的节点
       if (!circle.containsKey(hash)) {
         SortedMap<Integer, T> tailMap = circle.tailMap(hash);
         hash = tailMap.isEmpty() ? circle.firstKey() : tailMap.firstKey();
       }
       return circle.get(hash);
     }
    
    }

如上是java代码。

参考地址：https://weblogs.java.net/blog/2007/11/27/consistent-hashing
http://blog.sina.com.cn/s/blog_3fde8252010147j5.html
