---
layout: default
title:  CentOS6.4下rsync同步文件
categories:
  - linux

---
# {{ page.title }}

[原文链接](http://www.cnblogs.com/itech/archive/2009/08/10/1542945.html)

##1. 安装

命令安装：

	# sudo apt-get  install  rsync  注：在debian、ubuntu 等在线安装方法；
	# yum install rsync    注：Fedora、Redhat 等在线安装方法；
	# rpm -ivh rsync       注：Fedora、Redhat 等rpm包安装方法；

软件包安装：

	wget http://rsync.samba.org/ftp/rsync/rsync-3.0.7.tar.gz
	tar xvf  rsync-xxx.tar.gz
	cd rsync-xxx
	./configure --prefix=/usr  ;make ;make install   注：在用源码包编译安装之前，您得安装gcc等编译开具才行；

##2. 配置文件

sync的主要有以下三个配置文件rsyncd.conf(主配置文件)、rsyncd.secrets(密码文件)、rsyncd.motd(rysnc服务器信息,每次连接的时候会出现此文件内容)

###2.1. rsyncd.conf

默认路径：/etc/rsyncd.conf

示例：

	# Distributed under the terms of the GNU General Public License v2
	# Minimal configuration file for rsync daemon
	# See rsync(1) and rsyncd.conf(5) man pages for help

	# This line is required by the /etc/init.d/rsyncd script
	pid file = /var/run/rsyncd.pid
	port = 873
	address = 10.0.0.1 #服务器ip
	#uid = nobody
	#gid = nobody
	uid = root
	gid = root

	use chroot = yes
	read only = yes

	#limit access to private LANs
	hosts allow=10.0.0.1/255.255.255.0
	hosts deny=*

	max connections = 5
	motd file = /etc/rsyncd.motd

	#This will give you a separate log file
	#log file = /var/log/rsync.log

	#This will log every file transferred - up to 85,000+ per user, per sync
	#transfer logging = yes

	log format = %t %a %m %f %b
	syslog facility = local3
	timeout = 300

	[nginx]
	path = /home/work/nginx
	list=yes
	ignore errors
	auth users = root
	secrets file = /etc/rsyncd.secrets
	comment = This is RHEL 4 data

说明：

	pid file = /var/run/rsyncd.pid   注：告诉进程写到 /var/run/rsyncd.pid 文件中；
	port = 873  注：指定运行端口，默认是873，您可以自己指定；
	address = 192.168.1.171  注：指定服务器IP地址
	uid = nobody
	gid = nobdoy
	
	注：服务器端传输文件时，要发哪个用户和用户组来执行，默认是nobody。 如果用nobody 用户和用户组，可能遇到权限问题，有些文件从服务器上拉不下来。所以我就偷懒，为了方便，用了root 。不过您可以在定义要同步的目录时定义的模块中指定用户来解决权限的问题。
	
	use chroot = yes
	
	注：用chroot，在传输文件之前，服务器守护程序在将chroot 到文件系统中的目录中，这样做的好处是可能保护系统被安装漏洞侵袭的可能。缺点是需要超级用户权限。另外对符号链接文件，将会排除在外。也就是说，你在 rsync服务器上，如果有符号链接，你在备份服务器上运行客户端的同步数据时，只会把符号链接名同步下来，并不会同步符号链接的内容；这个需要自己来尝 试
	
	read only = yes
	
	注：read only 是只读选择，也就是说，不让客户端上传文件到服务器上。还有一个 write only选项，自己尝试是做什么用的吧；
	
	#limit access to private LANs
	hosts allow=192.168.1.0/255.255.255.0 10.0.1.0/255.255.255.0
	
	注：在您可以指定单个IP，也可以指定整个网段，能提高安全性。格式是ip 与ip 之间、ip和网段之间、网段和网段之间要用空格隔开；
	
	max connections = 5
	
	注：客户端最多连接数
	
	log file = /var/log/rsync.log

	注：rsync 服务器的日志；

	transfer logging = yes

	注：这是传输文件的日志

	log format = %t %a %m %f %b
	syslog facility = local3
	timeout = 300

	[nginx]  #模块它为我们提供了一个链接的名字，在本模块中链接到了/home目录；要用[name] 形式

	path = /home    #指定文件目录所在位置，这是必须指定的
	auth users = root   #认证用户是root  ，是必须在服务器上存在的用户
	list=yes   #list 意思是把rsync 服务器上提供同步数据的目录在服务器上模块是否显示列出来。默认是yes 。如果你不想列出来，就no ；如果是no是比较安全的，至少别人不知道你的服务器上提供了哪些目录。你自己知道就行了；
	ignore errors  #忽略IO错误
	secrets file = /etc/rsyncd.secrets   #密码存在哪个文件
	comment = linuxsir home  data  #注释可以自己定义
	exclude = beinan/ samba/

	注：exclude是排除的意思，也就是说，要把/home目录下的easylife和samba排除在外； easylife/和samba/目录之间有空格分开

###2.2 rsyncd.secrets

密码文件格式很简单，rsyncd.secrets的内容格式为：

用户名:密码

我们在例子中rsyncd.secrets的内容如下类似的；在文档中说，有些系统不支持长密码，自己尝试着设置一下吧。

　　easylife:keer
　　root:mike

　　chown root.root rsyncd.secrets 　#修改属主
　　chmod 600 rsyncd.secrets     #修改权限

注：1、将rsyncd.secrets这个密码文件的文件属性设为root拥有, 且权限要设为600, 否则无法备份成功!            出于安全目的，文件的属性必需是只有属主可读。
　　2、这里的密码值得注意，为了安全你不能把系统用户的密码写在这里。比如你的系统用户easylife密码是000000，为了安全你可以让rsync中的easylife为keer。这和samba的用户认证的密码原理是差不多的。

###2.3 rsyncd.motd

它是定义rysnc服务器信息的，也就是用户登录信息。比如让用户知道这个服务器是谁提供的等；类似ftp服务器登录时，我们所看到的 linuxsir.org ftp ……。 当然这在全局定义变量时，并不是必须的，你可以用#号注掉，或删除；我在这里写了一个 rsyncd.motd的内容为：

　　++++++++++++++++++++++++++++++++++++++++++++++
　　Welcome to use the mike.org.cn rsync services!
           2002------2009
　　++++++++++++++++++++++++++++++++++++++++++++++

##3. 启动rsync服务器

启动rsync服务器相当简单，有以下几种方法

A、--daemon参数方式，是让rsync以服务器模式运行

　　#/usr/bin/rsync --daemon  --config=/etc/rsyncd/rsyncd.conf 　#--config用于指定rsyncd.conf的位置,如果在/etc下可以不写

B、xinetd方式

	yum install -y xinetd

修改services加入如下内容

　　# nano -w /etc/services

　　rsync　　873/tcp　　# rsync 
　　rsync　　873/udp　　# rsync

这一步一般可以不做，通常都有这两行(我的RHEL4和GENTOO默认都有)。修改的目的是让系统知道873端口对应的服务名为rsync。如没有的话就自行加入。

设定 /etc/xinetd.d/rsync, 简单例子如下:

　　# default: off
　　# description: The rsync server is a good addition to am ftp server, as it \
　　#       allows crc checksumming etc.
　　service rsync
　　{
        disable = no
        socket_type     = stream
        wait            = no
        user            = root
        server          = /usr/bin/rsync
        server_args     = --daemon
        log_on_failure  += USERID
　　}

上述, 主要是要打开rsync這個daemon, 一旦有rsync client要连接時, xinetd会把它转介給 rsyncd(port 873)。然后service xinetd restart, 使上述设定生效.

##4. 同步

rsync中的参数

　　-r 是递归 
　　-l 是链接文件，意思是拷贝链接文件；-p 表示保持文件原有权限；-t 保持文件原有时间；-g 保持文件原有用户组；-o 保持文件原有属主；-D 相当于块设备文件；
　　-z 传输时压缩；
　　-P 传输进度；
　　-v 传输时的进度等信息，和-P有点关系，自己试试。可以看文档；
　　-e ssh的参数建立起加密的连接。
　　-u只进行更新，防止本地新文件被重写，注意两者机器的时钟的同时
　　--progress是指显示出详细的进度情况
　　--delete是指如果服务器端删除了这一文件，那么客户端也相应把文件删除，保持真正的一致
　　--password-file=/password/path/file来指定密码文件，这样就可以在脚本中使用而无需交互式地输入验证密码了，这里需要注意的是这份密码文件权限属性要设得只有属主可读。

###4.1. 一些实例：


B1、列出rsync 服务器上的所提供的同步内容；

首先：我们看看rsync服务器上提供了哪些可用的数据源

    # rsync  --list-only  root@192.168.145.5::
    ++++++++++++++++++++++++++++++++++++++++++++++
    Welcome to use the mike.org.cn rsync services!
           2002------2009
    ++++++++++++++++++++++++++++++++++++++++++++++

    rhel4home       This is RHEL 4 data

注：前面是rsync所提供的数据源，也就是我们在rsyncd.conf中所写的[rhel4home]模块。而“This is RHEL 4 data”是由[rhel4home]模块中的 comment = This is RHEL 4 data 提供的；为什么没有把rhel4opt数据源列出来呢？因为我们在[rhel4opt]中已经把list=no了。

    $ rsync  --list-only  root@192.168.145.5::::rhel4home

    ++++++++++++++++++++++++++++++++++++++++++++++
    Welcome to use the mike.org.cn rsync services!
              2002------2009
    ++++++++++++++++++++++++++++++++++++++++++++++

    Password:
    drwxr-xr-x        4096 2009/03/15 21:33:13 .
    -rw-r--r--        1018 2009/03/02 02:33:41 ks.cfg
    -rwxr-xr-x       21288 2009/03/15 21:33:13 wgetpaste
    drwxrwxr-x        4096 2008/10/28 21:04:05 cvsroot
    drwx------        4096 2008/11/30 16:30:58 easylife
    drwsr-sr-x        4096 2008/09/20 22:18:05 giddir
    drwx------        4096 2008/09/29 14:18:46 quser1
    drwx------        4096 2008/09/27 14:38:12 quser2
    drwx------        4096 2008/11/14 06:10:19 test
    drwx------        4096 2008/09/22 16:50:37 vbird1
    drwx------        4096 2008/09/19 15:28:45 vbird2

后面的root@ip中，root是指定密码文件中的用户名，之后的::rhel4home这是rhel4home模块名
B2、rsync客户端同步数据；

#rsync -avzP root@192.168.145.5::rhel4home rhel4home
Password: 这里要输入root的密码，是服务器端rsyncd.secrets提供的。在前面的例子中我们用的是mike，输入的密码并不回显，输好就回车。

注： 这个命令的意思就是说，用root用户登录到服务器上，把rhel4home数据，同步到本地当前目录rhel4home上。当然本地的目录是可以你自己 定义的。如果当你在客户端上当前操作的目录下没有rhel4home这个目录时，系统会自动为你创建一个；当存在rhel4home这个目录中，你要注意 它的写权限。

#rsync -avzP  --delete linuxsir@linuxsir.org::rhel4home   rhel4home

这回我们引入一个--delete 选项，表示客户端上的数据要与服务器端完全一致，如果 linuxsirhome目录中有服务器上不存在的文件，则删除。最终目的是让linuxsirhome目录上的数据完全与服务器上保持一致；用的时候要 小心点，最好不要把已经有重要数所据的目录，当做本地更新目录，否则会把你的数据全部删除；

設定 rsync client

设定密码文件

    #rsync -avzP  --delete  --password-file=rsyncd.secrets   root@192.168.145.5::rhel4home rhel4home

这次我们加了一个选项 --password-file=rsyncd.secrets，这是当我们以root用户登录rsync服务器同步数据时，密码将读取rsyncd.secrets这个文件。这个文件内容只是root用户的密码。我们要如下做；

    # touch rsyncd.secrets
    # chmod 600 rsyncd.secrets  一定要设置权限
    # echo "mike"> rsyncd.secrets

    # rsync -avzP  --delete  --password-file=rsyncd.secrets   root@192.168.145.5::rhel4home rhel4home

注：这里需要注意的是这份密码文件权限属性要设得只有属主可读。

这样就不需要密码了；其实这是比较重要的，因为服务器通过crond 计划任务还是有必要的；


