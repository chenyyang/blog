---
layout: default
title:  ubuntu root密码重置
categories:
  - linux

---
# {{ page.title }}

##1. 重置密码

	sudo passwd root

先输入当前用户的密码，然后输入两次新root密码。

##2. 切换root用户

	su root

su后面是需要切换到的用户，接着输入这个用户的密码。
