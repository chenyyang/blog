---
layout: default
title:  Protocol Buffers序列化
categories:
  - java

---
# {{ page.title }}

[原文链接](http://www.jianshu.com/p/da505e26e68e)

Protocol buffers是google使用的一种结构化数据序列化编码解码方式，采用简单的二进制格式，他比XML、JSON格式体积更小，编码解码效率更高.

##1. 优点


相对于XML，Protocol Buffers的具有如下几个优点：<br>

1.简洁<br>

2.体积小：消息大小只需要XML的1/10 ～ 1/3<br>

3.速度快：解析速度比XML快20 ～ 100倍<br>

4.使用Protocol Buffers的编译器，可以生成更容易在编程中使用的数据访问代码<br>

5.更好的兼容性，Protocol Buffers设计的一个原则就是要能够很好的支持向下或向上兼容。<br>

<img src="/blog/image/protobuf0.png" style="max-width:100%;"/>

##2. 类型

支持类型：

<img src="/blog/image/protobuf1.png" style="max-width:100%;"/>

##3. 变长编码

key+value的表达形式，key种包含类型和位置信息，value用变长编码表示值。

###3.1. key

<img src="/blog/image/protobuf3.png" style="max-width:100%;"/>

wire_type : 

<img src="/blog/image/protobuf4.png" style="max-width:100%;"/>

###3.2. value
在Protocol Buffers中采用Base-128变长编码，所谓变长编码是和定长编码相对的，定长编码使用固定字节数来表示，如int32类型的数字固定使用4 bytes表示，而变长编码是需要几个字节就使用几个字节，如对于int32类型的数字1来说，只需要1 bytes足够。Base-128变长编码的原则就两条：<br>

	1.每个字节使用使用低7位表示数字，除了最后一个字节，其他字节的最高位都设置为1。<br>
	
	2.采用Little-Endian字节序<br>

<img src="/blog/image/protobuf2.png" style="max-width:100%;"/>

###3.3. 例子

例子1

 <img src="/blog/image/protobuf5.png" style="max-width:100%;"/>

例子2

 <img src="/blog/image/protobuf6.png" style="max-width:100%;"/>


