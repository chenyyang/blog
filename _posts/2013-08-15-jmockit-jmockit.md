---
layout: default
title: jmockit 
categories:
  - jmockit
---

# {{ page.title }}

[jmockit参考原文](http://www.iteye.com/blogs/tag/jmockit)

## 1. 根据传入的参数做限制
代码：

	new Expectations() { 
		test.getTestBoolean(10); 
		result= false; 
		times= 1; 
	};
	
	new Expectations(MockService.class) { 
		test.getTestBoolean(10); 
		result= false; 
		times= 1; 
	}; 


第二种方法会限制只有传入的数值是10的才会进入这个设置中，如果不是10，则会进入自身的test.getTestBoolean(10)逻辑中。

第一种方法会校验传入的参数是否是10，如果不是报错。

	// 对私有int类型的memberCounts进行设值
	this.setField(instanceInternalAccess, "memberCounts", 2);
	// 对私有方法进行mock
	this.invoke(instanceInternalAccess, "getMemberCounts");
	result= 2;
以上是对变量和方法的反射控制。
  

## 2.MockUp获取对象的属性

代码：

	new MockUp<XCacheImpl>() {
		public XCacheImpl it;
	}

对象名一定要是it；

只有被添加@Mock的方法才会被mock；
