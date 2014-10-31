---
layout: default
title:  jvm不能创建线程问题排查
categories:
  - java

---
# {{ page.title }}

有进程报出这样的异常“java.lang.OutOfMemoryError: unable to create new native thread”。甚至机器上执行shell命令也会报”-bash: fork: Resource temporarily unavailable”异常。机器上的其他java进程也会受影响.

##1. 可能原因：内存不够

这个异常问题本质原因是我们创建了太多的线程，而能创建的线程数是有限制的，导致了异常的发生。能创建的线程数的具体计算公式如下： 
	
	(MaxProcessMemory – JVMMemory – ReservedOsMemory) / (ThreadStackSize) = Number of threads 
	MaxProcessMemory  指的是一个进程的最大内存
	JVMMemory         JVM内存
	ReservedOsMemory  保留的操作系统内存
	ThreadStackSize   线程栈的大小

在java语言里， 当你创建一个线程的时候，虚拟机会在JVM内存创建一个Thread对象同时创建一个操作系统线程，而这个系统线程的内存用的不是JVMMemory，而是系统中剩下的内存(MaxProcessMemory – JVMMemory – ReservedOsMemory)。

由公式得出结论：你给JVM内存越多，那么你能创建的线程越少，越容易发生java.lang.OutOfMemoryError: unable to create new native thread。 

咦，有点背我们的常理，恩，让我们来验证一下,依旧使用上面的测试程序，加上下面的JVM参数，测试结果如下： 

	ThreadStackSize        JVMMemory                 能创建的线程数
	默认的325K             -Xms1024m -Xmx1024m        i = 2655
	默认的325K             -Xms1224m -Xmx1224m        i = 2072
	默认的325K             -Xms1324m -Xmx1324m        i = 1753
	默认的325K             -Xms1424m -Xmx1424m        i = 1435
	-Xss1024k              -Xms1424m -Xmx1424m        i = 452 

和结论一致。

解决方案：

a, MaxProcessMemory 使用64位操作系统或者加内存。
b, JVMMemory   减少JVMMemory的分配
c, ThreadStackSize  减小单个线程的栈大小

XX:MaxDirectMemorySize可以设置jvm的直接内存，设置这个就用不到上面的公式了。

##2. 系统限制

有时候，一看以为内存不够导致无法创建新的线程，但是观察机器上的内存还有空闲，可以猜测是哪个地方对线程创建有限制。

	echo "1000000" > /proc/sys/kernel/threads-max
	echo "1000000" > /proc/sys/kernel/pid_max     （默认32768）
	echo "2000000" > /proc/sys/vm/max_map_count   （默认65530）
	ulimit -u unlimited   (设置max user processes的值)

修改以后查看：

	[admin@bufer108081.tbc ~]$ uname -a
	Linux bufer108081.tbc 2.6.32-220.23.2.ali927.el5.x86_64 #1 SMP Mon Jan 28 14:57:06 CST 2013 x86_64 x86_64 x86_64 GNU/Linux
	[admin@bufer108081.tbc ~]$ java -version
	java version "1.7.0_51"
	Java(TM) SE Runtime Environment (build 1.7.0_51-b13)
	OpenJDK (Alibaba) 64-Bit Server VM (build 24.45-b08-internal, mixed mode)
	[admin@bufer108081.tbc ~]$ ulimit -a
	core file size          (blocks, -c) 0
	data seg size           (kbytes, -d) unlimited
	scheduling priority             (-e) 0
	file size               (blocks, -f) unlimited
	pending signals                 (-i) 387068
	max locked memory       (kbytes, -l) 64
	max memory size         (kbytes, -m) unlimited
	open files                      (-n) 131072
	pipe size            (512 bytes, -p) 8
	POSIX message queues     (bytes, -q) 819200
	real-time priority              (-r) 0
	stack size              (kbytes, -s) 10240
	cpu time               (seconds, -t) unlimited
	max user processes              (-u) unlimited
	virtual memory          (kbytes, -v) unlimited
	file locks                      (-x) unlimited
	[admin@bufer108081.tbc ~/dev/baoniu]$ free -g
	             total       used       free     shared    buffers     cached
	Mem:            47         31         15          0          3         25
	-/+ buffers/cache:          3         44
	Swap:            0          0          0


上面是查看的方式，通过配置新参数以后线程数可以上升了。

##3. 使用线程池

一般来说，单机线程数过多可以考虑使用线程池或者更多的服务器。



