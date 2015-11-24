---
layout: default
title:  Mysql改密码和授权
categories:
  - linux

---
# {{ page.title }}


##1. 修改密码

1.命令行修改

	[root@chenyang ~]# mysqladmin -u USER -p password PASSWORD

    该命令之后会提示输入原密码，输入正确后即可修改。

2.UPDATE mysql.user表

    登入mysql

       [root@chenyang ~]# mysql -u root -p
       Enter password: 
       mysql> use mysql
       mysql>UPDATE user SET password=PASSWORD('123456') WHERE user='root';
       mysql>FLUSH PRIVILEGES; 


##2. 授权

mysql.user表是用来管理用户密码和权限的。

       [root@chenyang ~]# mysql -u root -p
       Enter password: 
       mysql> use mysql
       mysql> insert into user (Host,User,Password) values ('此处输入本机ip',root,Password('此处输入新的密码'));
       mysql> grant all privileges on *.* to root@'%' IDENTIFIED BY  '此处输入刚设置的新密码' with GRANT OPTION;
       mysql> FLUSH PRIVILEGES;

分析

insert into user (Host,User,Password) values ('此处输入本机ip','新用户名',Password('此处输入新的密码')); 插入了一个用户的权限，新用户用制定的ip和新设置的密码登入，这样新用户用127.0.0.1就不能登入了。

host列是指定登录的ip，比如说 user=root host=192.168.1.1 ，这里的意思就是说，root用户只能通过 192.168.1.1的客户端去访问，而%则是个通配符， 如果host=192.168.1.%，那么就表示 只要是 ip为host=192.168.1.前缀的客户端都可以连接，那么host=%的话则表示所有ip都有权去连接;

grant all privileges on *.* to '新用户名'@'%' IDENTIFIED BY  '此处输入刚设置的新密码' with GRANT OPTION;  *.*是设置用新用户登入，所有的库和表都能访问。

FLUSH PRIVILEGES; 表示让设置生效,否则重启才能生效。 
