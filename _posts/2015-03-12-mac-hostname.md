---
layout: default
title:  Mac终端主机名 
categories:
  - mac

---

# {{ page.title }}


##1. 改终端的计算器名字

	#sudo scutil --set HostName newName

重启终端就可以看到新名字

##2. 隐藏终端的名字

	#sudu vim /etc/bashrc

打开文件

	#PS1='\h:\W \u\$ '
	PS1='\W \$'
