---
layout: default
title:  lsof命令
categories:
  - java

---
# {{ page.title }}

##1. 简介

lsof(list open files)是一个列出当前系统打开文件的工具。在linux环境下，任何事物都以文件的形式存在，通过文件不仅仅可以访问常规数据，还可以访问网络连接和硬件。所以如传输控制协议 (TCP) 和用户数据报协议 (UDP) 套接字等，系统在后台都为该应用程序分配了一个文件描述符，无论这个文件的本质如何，该文件描述符为应用程序与基础操作系统之间的交互提供了通用接口。因为应用程序打开文件的描述符列表提供了大量关于这个应用程序本身的信息，因此通过lsof工具能够查看这个列表对系统监测以及排错将是很有帮助的。

##2. 语法

lsof ［options］ filename

	lsof abc.txt 显示开启文件abc.txt的进程
	lsof -c abc 显示abc进程现在打开的文件
	lsof -c -p 1234 列出进程号为1234的进程所打开的文件
	lsof -g gid 显示归属gid的进程情况
	lsof +d /usr/local/ 显示目录下被进程开启的文件
	lsof +D /usr/local/ 同上，但是会搜索目录下的目录，时间较长
	lsof -d 4 显示使用fd为4的进程
	lsof -i 用以显示符合条件的进程情况
	lsof -i[46] [protocol][@hostname|hostaddr][:service|port]
	--> IPv4 or IPv6
	  protocol --> TCP or UDP
	  hostname --> Internet host name
	  hostaddr --> IPv4地址
	  service --> /etc/service中的 service name (可以不止一个)
	  port --> 端口号 (可以不止一个)

上面是语法

##3. 输出信息含义

	COMMAND     PID        USER   FD      TYPE             DEVICE SIZE/OFF       NODE NAME
	init          1        root  cwd       DIR                8,1     4096          2 /
	init          1        root  rtd       DIR                8,1     4096          2 /
	init          1        root  txt       REG                8,1   150584     654127 /sbin/init
	udevd       415        root    0u      CHR                1,3      0t0       6254 /dev/null
	udevd       415        root    1u      CHR                1,3      0t0       6254 /dev/null
	udevd       415        root    2u      CHR                1,3      0t0       6254 /dev/null
	udevd       690        root  mem       REG                8,1    51736     302589 /lib/x86_64-linux-gnu/libnss_files-2.13.so
	syslogd    1246      syslog    2w      REG                8,1    10187     245418 /var/log/auth.log
	syslogd    1246      syslog    3w      REG                8,1    10118     245342 /var/log/syslog
	dd         1271        root    0r      REG                0,3        0 4026532038 /proc/kmsg
	dd         1271        root    1w     FIFO               0,15      0t0        409 /run/klogd/kmsg
	dd         1271        root    2u      CHR                1,3      0t0       6254 /dev/null

直接输入lsof部分输出为。

lsof输出各列信息的意义如下：

COMMAND：进程的名称 PID：进程标识符

USER：进程所有者

FD：文件描述符，应用程序通过文件描述符识别该文件。如cwd、txt等 TYPE：文件类型，如DIR、REG等

DEVICE：指定磁盘的名称

SIZE：文件的大小

NODE：索引节点（文件在磁盘上的标识）

NAME：打开文件的确切名称

Type：列则比较直观。文件和目录分别称为 REG 和 DIR。而CHR 和 BLK，分别表示字符和块设备；或者 UNIX、FIFO 和 IPv4，分别表示 UNIX 域套接字、先进先出 (FIFO) 队列和网际协议 (IP) 套接字。

##4. 举例

	lsof -utony //查看用户tony的进程的文件使用情况
	lsof -i //显示所有打开的端口
	lsof -i:80 //显示所有打开80端口的进程


