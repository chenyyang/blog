---
layout: default
title:  BeanPostProcessor init前后加操作
categories:
  - java

---
# {{ page.title }}

Spring的BeanPostProcessor接口，该接口作用是：如果我们需要在Spring容器完成Bean的实例化，配置和其他的初始化后添加一些自己的逻辑处理，我们就可以定义一个或者多个BeanPostProcessor接口的实现。
##1. BeanPostProcessor使用

    package com.spring.test.di;
    
    import org.springframework.beans.BeansException;
    import org.springframework.beans.factory.config.BeanPostProcessor;

    @Service    
    public class BeanPostPrcessorImpl implements BeanPostProcessor {
        
        // Bean 实例化之前进行的处理
        public Object postProcessBeforeInitialization(Object bean, String beanName)
               throws BeansException {
           System.out.println("对象" + beanName + "开始实例化");
           return bean;
        }
        
        // Bean 实例化之后进行的处理
        public Object postProcessAfterInitialization(Object bean, String beanName)
               throws BeansException {
           System.out.println("对象" + beanName + "实例化完成");
           return bean;
        }
    
    }


如上是BeanPostProcessor的继承类的书写。@Service会在自动的时候自动注册，或者在配置：
	
	<bean class="com.spring.test.di.BeanPostPrcessorImpl"/>

如上配置是等效的。

##2. BeanPostProcessor注册

只要将BeanPostProcessor注册到容器中，Spring会在启动时自动获取并注册。所以即使是懒加载的方式，BeanPostProcessor也会被加载。	

##3. BeanPostProcessor顺序

1、如果使用BeanFactory实现，非ApplicationContext实现，BeanPostProcessor执行顺序就是添加顺序。

2、如果使用的是AbstractApplicationContext（实现了ApplicationContext）的实现，则通过如下规则指定顺序。

2.1、PriorityOrdered（继承了Ordered），实现了该接口的BeanPostProcessor会在第一个顺序注册，标识高优先级顺序，即比实现Ordered的具有更高的优先级；

2.2、Ordered，实现了该接口的BeanPostProcessor会第二个顺序注册；

	int HIGHEST_PRECEDENCE = Integer.MIN_VALUE;//最高优先级
	int LOWEST_PRECEDENCE = Integer.MAX_VALUE;//最低优先级


即数字越小优先级越高，数字越大优先级越低，如0（高优先级）——1000（低优先级）

2.3、无序的，没有实现Ordered/ PriorityOrdered的会在第三个顺序注册；

2.4、内部Bean后处理器，实现了MergedBeanDefinitionPostProcessor接口的是内部Bean PostProcessor，将在最后且无序注册。
