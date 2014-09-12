---
layout: default
title:  java class.getMethods
categories:
  - java

---
# {{ page.title }}

##1. Class.getMethod

	Method Class.getMethod(String name, Class<?>... parameterTypes)
	Method[] getMethods()

获取的是public方法，包括本类和父类中的。

##2. Class.getDeclaredMethod

	Method getDeclaredMethod(String name, Class<?>... parameterTypes)
	Method[] getDeclaredMethods()

获取的是本类中定义的方法，不包括父类中的。

