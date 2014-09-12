---
layout: default
title:  spring 拦截器加载顺序
categories:
  - java

---
# {{ page.title }}

##1. 配置文件的顺序

默认情况下是根据advisor的加载顺序执行的。也就是配置文件中的顺序。

##2. order值

AbstractAdvisorAutoProxyCreator.java :

	public abstract class AbstractAdvisorAutoProxyCreator extends AbstractAutoProxyCreator {
	
		protected List sortAdvisors(List advisors) {
			Collections.sort(advisors, new OrderComparator());
			return advisors;
		}
	
	...
	}	


OrderComparator.java :

	package org.springframework.core;
	
	import java.util.Comparator;
	
	public class OrderComparator implements Comparator {
	
		public int compare(Object o1, Object o2) {
			boolean p1 = (o1 instanceof PriorityOrdered);
			boolean p2 = (o2 instanceof PriorityOrdered);
			if (p1 && !p2) {
				return -1;
			}
			else if (p2 && !p1) {
				return 1;
			}
	
			// Direct evaluation instead of Integer.compareTo to avoid unnecessary object creation.
			int i1 = getOrder(o1);
			int i2 = getOrder(o2);
			return (i1 < i2) ? -1 : (i1 > i2) ? 1 : 0;
		}
	
		protected int getOrder(Object obj) {
			return (obj instanceof Ordered ? ((Ordered) obj).getOrder() : Ordered.LOWEST_PRECEDENCE);
		}
	
	}


OrderComparator是排序算法的类。每次class init 以后会筛选出匹配的advisor，然后会调用AbstractAdvisorAutoProxyCreator.sortAdvisors方法来排序。这样就根据order由小到大排序了。

##3.AbstractBeanDefinition.role来比较

	public abstract class AbstractBeanDefinition extends BeanMetadataAttributeAccessor
		implements BeanDefinition, Cloneable {
		
		public int getRole() {
			return this.role;
		}
	}

具体role的值：
	
	public interface BeanDefinition extends AttributeAccessor, BeanMetadataElement {
		/**
		 *用户定义的
		 */
		int ROLE_APPLICATION = 0;

		/**
		 *一些配置的支持
		 */
		int ROLE_SUPPORT = 1;

		/**
		 *基础类型，一般是系统定义的
		 */
		int ROLE_INFRASTRUCTURE = 2; 
	
	...
	}

如果是ROLE_INFRASTRUCTURE类型的拦截器（例如事务的拦截器：BeanFactoryTransactionAttributeSourceAdvisor）则会比项目中定义的要晚拦截，先用项目中的拦截器，后用系统定义的拦截器。一般我们的都是ROLE_APPLICATION类型。
