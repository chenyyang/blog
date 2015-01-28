---
layout: default
title:  aop interceptor annotation实现
categories:
  - java

---
# {{ page.title }}

##1. annotation

	
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

包含此annotation才会被后面match到。

##2. interceptor

	import org.aopalliance.intercept.MethodInterceptor;
	import org.aopalliance.intercept.MethodInvocation;
	import org.springframework.stereotype.Service;
	import org.springframework.util.StopWatch;
	
	
	
	@Service
	public class TestInterceptor implements MethodInterceptor {
	
	    @Override
	    public Object invoke(MethodInvocation invocation) throws Throwable {
	        final StopWatch stopWatch = new StopWatch(invocation.getMethod().toGenericString());
	        stopWatch.start("invocation.proceed()");
	        try {
	            return invocation.proceed();
	        } finally {
	            stopWatch.stop();
	        }
	    }
	}

被Advisor matches 的方法会进入此interceptor中invocation.proceed()会执行原方法。

##3. Advisor

	import org.aopalliance.aop.Advice;
	import org.springframework.aop.Pointcut;
	import org.springframework.aop.support.AbstractBeanFactoryPointcutAdvisor;
	import org.springframework.aop.support.StaticMethodMatcherPointcut;
	import org.springframework.beans.factory.annotation.Autowired;
	
	
	public class TestAdvisor extends AbstractBeanFactoryPointcutAdvisor {
	
	    private static final long serialVersionUID = 1L;
	
	    private final StaticMethodMatcherPointcut pointcut = new StaticMethodMatcherPointcut() {
	
		@Override
		public boolean matches(java.lang.reflect.Method method,Class targetClass) {
	                    return method.isAnnotationPresent(TestAnnotation.class);
		}
	    };
	
	    @Autowired
	    private TestInterceptor interceptor;
	
	    @Override
	    public Pointcut getPointcut() {
	        return this.pointcut;
	    }
	
	    @Override
	    public Advice getAdvice() {
	        return this.interceptor;
	    }
	}

用于判断哪些方法会被拦截，并且拦截后会进入getAdvice()返回的interceptor.invoke方法。

##4. 配置文件

	<bean class="com.test.service.TestAdvisor"></bean>
	<bean class="org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator">
		<property name="proxyTargetClass" value="true"/>
	</bean>

##5. 基础知识
1. "切入点(Advisor)"的定义相当于更加细化地规定了哪些方法被哪些拦截器所拦截，而并非所有的方法都被所有的拦截器所拦截。在ProxyFactoryBean的属性中，interceptorNames属性的对象也由拦截（Advice）变成了引入通知（Advisor），正是在Advisor中详细定义了切入点（PointCut）和拦截（Advice）的对应关系，比如常见的基于名字的切入点匹配（NameMatchMethodPointcutAdvisor类）和基于正则表达式的切入点匹配（RegExpPointcutAdvisor类）。这些切入点都属于”静态切入点“，因为他们只在代理创建的时候被创建一次，而不是每次运行都创建。
2. bean在init的时候会便利一遍所有的拦截器，如果有匹配的（只要一个方法匹配就会return true）就会用proxy代理。生成新的代理实例，例如transaction是生成cglib代理子类。
3. Spring只支持方法拦截，也就是说，只能在方法的前后进行拦截，而不能在属性前后进行拦截。
4. Spring支持四种拦截类型：目标方法调用前（before），目标方法调用后（after），目标方法调用前后（around），以及目标方法抛出异常（throw）。以上的拦截的问题在于，不能对于某些有规律的方法进行拦截，而只能对指定方法作拦截。
