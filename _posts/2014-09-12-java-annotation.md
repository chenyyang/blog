---
layout: default
title:  Annotation继承关系
categories:
  - java

---
# {{ page.title }}

##1. TestAnnotation.java

	import java.lang.annotation.Documented;
	import java.lang.annotation.ElementType;
	import java.lang.annotation.Inherited;
	import java.lang.annotation.Retention;
	import java.lang.annotation.RetentionPolicy;
	import java.lang.annotation.Target;

	@Target({ ElementType.METHOD, ElementType.TYPE })
	@Retention(RetentionPolicy.RUNTIME)
	@Documented
	@Inherited
	public @interface TestAnnotation {
	
	}

TestAnnotation.java用于测试的annotation

##2. Bean.java

	@TestAnnotation
	public abstract class Bean {
	
		@TestAnnotation
		public abstract void abstractMethod();
	
		@TestAnnotation
		public void extendsMethod() {
			System.out
					.print("ProfilingMethodInterceptor123 Executing method 'foo'.");
		}
	
		@TestAnnotation
		public void overrideMethod() {
			System.out
					.print("ProfilingMethodInterceptor123 Executing method 'foo'.");
		}
	   
	
	}

父类

##3. CopyOfBean.java

	package com.xiaomi.miliao.newsfeed.inter;
	
	import java.lang.annotation.Annotation;
	import java.lang.reflect.Method;
	
	public class CopyOfBean extends Bean {
	
		public void abstractMethod() {
		}
	
		public void overrideMethod() {
		}
	
	
		public static void main(String[] arg) throws NoSuchMethodException, SecurityException {
	
			System.out.print(" Bean class  annotation  : ");
			for (Annotation a : Bean.class.getAnnotations()) {
				System.out.print(" " + a + "  ");
			}
			System.out.println();
			System.out.print(" CopyOfBean class  annotation  : ");
			for (Annotation a : CopyOfBean.class.getAnnotations()) {
				System.out.print(" " + a + "  ");
			}
			System.out.println();
			System.out.println();
			
			Method[] methods = Bean.class.getDeclaredMethods();
			for (Method method : methods) {
				System.out.println(" Bean method " + method + "  annotation length : "+ method.getAnnotations().length);
				for(Annotation a :method.getAnnotations()){
					System.out.print(" "+a+"  ");
				}
				System.out.println();
				Method method1 = CopyOfBean.class.getMethod(method.getName(),
						method.getParameterTypes());
				System.out.println(" CopyOfBean method " + method1
						+ "  annotation length : "
						+ method1.getAnnotations().length);
				
				for(Annotation a :method1.getAnnotations()){
					System.out.print(" "+a+"  ");
				}
				System.out.println();
				System.out.println();
			}
			
		}
	} 

子类。

##4. 结果 

	 Bean class  annotation  :  @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	 CopyOfBean class  annotation  :  @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	
	 Bean method public void com.xiaomi.miliao.newsfeed.inter.Bean.overrideMethod()  annotation length : 1
	 @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	 CopyOfBean method public void com.xiaomi.miliao.newsfeed.inter.CopyOfBean.overrideMethod()  annotation length : 0
	
	
	 Bean method public abstract void com.xiaomi.miliao.newsfeed.inter.Bean.abstractMethod()  annotation length : 1
	 @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	 CopyOfBean method public void com.xiaomi.miliao.newsfeed.inter.CopyOfBean.abstractMethod()  annotation length : 0
	
	
	 Bean method public void com.xiaomi.miliao.newsfeed.inter.Bean.extendsMethod()  annotation length : 1
	 @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	 CopyOfBean method public void com.xiaomi.miliao.newsfeed.inter.Bean.extendsMethod()  annotation length : 1
	 @com.xiaomi.miliao.newsfeed.inter.TestAnnotation()  
	
结果如上

##5. 总结
1. 子类继承父类上的annotation（因为annotation上@Inherited标注）
2. 子类继承的方法上的annotation被继承
3. 子类重写和覆盖的方法上的annotation不被继承

