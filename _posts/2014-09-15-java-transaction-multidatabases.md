---
layout: default
title:  jade事务多数据源支持
categories:
  - java

---
# {{ page.title }}

##1.现在事务的问题

### 1.1.  connection

	Connection newCon = this.dataSource.getConnection();

如上是事务获取connection的方式，所以可以通过重写getConnection()方法来配置我们想要的数据源的连接。

### 1.2.  数据源的绑定

doBegin中的绑定：

	// Bind the session holder to the thread.
	if (txObject.isNewConnectionHolder()) {
		TransactionSynchronizationManager.bindResource(getDataSource(), txObject.getConnectionHolder());
	}

doCleanupAfterCompletion中的解除绑定：

	// Remove the connection holder from the thread, if exposed.
	if (txObject.isNewConnectionHolder()) {
		TransactionSynchronizationManager.unbindResource(this.dataSource);
	} 
可以看到二者的方式不同，如果二者的值是一样则不要紧，jade中会通过 TransactionSynchronizationManager.getResource(key)获取connection，为了让jade取到事务中的connection，必须在doBegin中绑定进去，所以需要重写getDataSource()，让他返回这个事务中数据库的connection。这样就会在doBegin中把这个connection绑定到事务线程中，后面jade就会取出同一连接。因为后面doCleanupAfterCompletion中解除绑定this.dataSource，所以为了防止报错，doBegin需要加上绑定this.dataSource到同一connection。 TransactionSynchronizationManager.bindResource(this.dataSource,TransactionSynchronizationManager.getResource(getDataSource()));

### 1.3.  动态获取此事务连接的数据源

之前说需要重写getDataSource()，返回此事务需要配置的数据源。这个可以用连接器来实现。配置一个连接器，通过ThreadLocal<String> contextHolder = new ThreadLocal<String>();来存储配置的数据源。在事务开始的时候contextHolder.set(catelog);存下来用户的信息
 

##2. 具体代码

DynamicDataSource.java,继承BasicDataSource需要在配置文件中配置：

	<bean id="daynamicDataSource" class="com.test.jade.transaction.datasource.DynamicDataSource">
		<property name="jadeDataSourceFactory" ref="jade.dataSourceFactory" />
		<property name="defaultCatelog" value="test" />
	</bean>

代码：
	
	public class DynamicDataSource extends BasicDataSource {
		//factory，根据自己所在的环境设置	
	    private JadeDataSourceFactory jadeDataSourceFactory;
	
	    private static Logger logger = LoggerFactory.getLogger(DynamicDataSource.class);
	
	    private String defaultCatelog;
	
	    public String getDefaultCatelog() {
	        return defaultCatelog;
	    }
	
	    public void setDefaultCatelog(String defaultCatelog) {
	        this.defaultCatelog = defaultCatelog;
	    }
	
	    public JadeDataSourceFactory getJadeDataSourceFactory() {
	        return jadeDataSourceFactory;
	    }
	
	    public void setJadeDataSourceFactory(JadeDataSourceFactory jadeDataSourceFactory) {
	        this.jadeDataSourceFactory = jadeDataSourceFactory;
	    }
		//核心方法，事务获取的connection
	    @Override
	    public Connection getConnection() throws SQLException {
	        return getDataSource().getConnection();
	    }
	
	    public DataSource getDataSource() {
	        return this.jadeDataSourceFactory.getDataSource(getCatelog(), DbRole.MASTER, null);
	    }
	
	    private String getCatelog() {
	        String threadCatelog = DBContextHolder.getCateloge();
	        String catelog = StringUtils.isBlank(threadCatelog) ? defaultCatelog : threadCatelog;
	        logger.debug(" get thread catelog : {} return catelog : {}", threadCatelog, catelog);
	        return catelog;
	    }
	
	}

DynamicDataSourceTransactionManager，继承DataSourceTransactionManager，需要在配置文件中配置：
	
	<bean id="transactionManager" class="com.test.jade.transaction.datasource.ThemeDataSourceTransactionManager">
        	<property name="daynamicDataSource" ref="daynamicDataSource" />
	</bean> 

代码：
	
	public class DynamicDataSourceTransactionManager extends DataSourceTransactionManager {
	
	    private DynamicDataSource daynamicDataSource;
	
	    private static Logger logger = LoggerFactory.getLogger(DynamicDataSourceTransactionManager.class);
	
	    /**
	     * Return the JDBC DataSource that this instance manages transactions for.
	     */
	    @Override
	    public DataSource getDataSource() {
	        return daynamicDataSource.getDataSource();
	    }
	
	    public DynamicDataSource getDaynamicDataSource() {
	        return daynamicDataSource;
	    }
	
	    public void setDaynamicDataSource(DynamicDataSource daynamicDataSource) {
	        this.daynamicDataSource = daynamicDataSource;
	        super.setDataSource(daynamicDataSource);
	    }
	
	    protected void doBegin(Object transaction, TransactionDefinition definition) {
	        logger.debug("  doBegin ");
	        super.doBegin(transaction, definition);
			TransactionSynchronizationManager.bindResource(super.getDataSource(),
					TransactionSynchronizationManager.getResource(getDataSource()));
	    }
	
	    protected void doCleanupAfterCompletion(Object transaction) {
	        logger.debug("  doCleanupAfterCompletion ");
	        TransactionSynchronizationManager.unbindResource(getDataSource());
	        super.doCleanupAfterCompletion(transaction);
	    }
	
	}

这个主要是完成从外部控制DataSource和connection。如果是只有一个数据源，代码可以到此为止，defaultCatelog设置为默认的值，然后通过这个默认的值取factory中取到DataSource即可。但是如果多数据源，则需要一个地方存储用户的catelog(此处的catelog可以定位到一个DataSource)。

DBContextHolder代码：

	public class DBContextHolder {
	
		// 保证线程间不受影响
		private static final ThreadLocal<String> contextHolder = new ThreadLocal<String>();
	
		private static Logger logger = LoggerFactory
				.getLogger(DBContextHolder.class);
	
		public static void clearCatelog() {
			contextHolder.remove();
		}
	
		public static String getCateloge() {
			logger.debug(" get catelog : {}", contextHolder.get());
			return contextHolder.get();
		}
	
		public static void setCatelog(String catelog) {
			logger.debug(" set catelog : {}", catelog);
			contextHolder.set(catelog);
		}
	}

DBContextHolder只是一个简单的线程安全的存储方法。有了这个还需要一个拦截器，用户可以在拦截器中配置catelog值。

JadeTransactional是annotation,用于给拦截器拦截使用：

	@Target({ ElementType.METHOD })
	@Retention(RetentionPolicy.RUNTIME)
	@Documented
	@Inherited
	public @interface JadeTransactional {
	    String catelog() default "";
	
	}

JadeTransactionalInterceptor拦截器：

	@Service
	public class JadeTransactionalInterceptor implements MethodInterceptor {
	
	    private static Logger logger = LoggerFactory.getLogger(JadeTransactionalInterceptor.class);
	
	    @Override
	    public Object invoke(MethodInvocation invocation) throws Throwable {
	        final StopWatch stopWatch = new StopWatch(invocation.getMethod().toGenericString());
	        stopWatch.start("invocation.proceed()");
	        logger.debug("JadeTransactionalInterceptor invoke start");
	        DBContextHolder.setCatelog(invocation.getMethod().getAnnotation(JadeTransactional.class).catelog());
	        try {
	            return invocation.proceed();
	        } finally {
	            stopWatch.stop();
	            DBContextHolder.clearCatelog();
	            logger.debug("JadeTransactionalInterceptor invoke end");
	        }
	    }
	}

JadeTransactionalAdvisor：

	public class JadeTransactionalAdvisor extends AbstractPointcutAdvisor implements InitializingBean {
	
	    private static final long serialVersionUID = 1L;
	
	    private static Logger logger = LoggerFactory.getLogger(JadeTransactionalAdvisor.class);
	
	    private final StaticMethodMatcherPointcut pointcut = new StaticMethodMatcherPointcut() {
	
	        @Override
	        public boolean matches(java.lang.reflect.Method method, Class targetClass) {
			//因为method可能是proxy代理过的bean.class，transaction是用cglib代理，所以class需要处理一下	
	            Class<?> userClass = ClassUtils.getUserClass(targetClass);
	            // The method may be on an interface, but we need attributes from the target class.
	            // If the target class is null, the method will be unchanged.
	            Method specificMethod = ClassUtils.getMostSpecificMethod(method, userClass);
	            boolean annotationPresent = specificMethod.isAnnotationPresent(JadeTransactional.class);
	            if (annotationPresent) {
	                logger.debug("matches success method : {} targetClass : {}", method, targetClass);
	            }
	            return annotationPresent;
	
	        }
	    };
	
	    @Autowired
	    private JadeTransactionalInterceptor interceptor;
	
	    @Override
	    public Pointcut getPointcut() {
	        return this.pointcut;
	    }
	
	    @Override
	    public Advice getAdvice() {
	        return this.interceptor;
	    }
	
	    // 拦截器会根据order排序，事务的拦截器order＝Ordered.LOWEST_PRECEDENCE，小的会先执行
	    @Override
	    public void afterPropertiesSet() throws Exception {
	        setOrder(Ordered.LOWEST_PRECEDENCE - 1);
	    }
	}

ClassUtils用于处理class的逻辑，包括取method的class，如果是cglib，直接取父类。

代码：

	/**
	 * copy from spring 4.0.6
	 * 
	 */
	public abstract class ClassUtils {
	
	    /** The CGLIB class separator character "$$" */
	    public static final String CGLIB_CLASS_SEPARATOR = "$$";
	
	    /** The package separator character '.' */
	    private static final char PACKAGE_SEPARATOR = '.';
	
	    /**
	     * Return the user-defined class for the given class: usually simply the given
	     * class, but the original class in case of a CGLIB-generated subclass.
	     * 
	     * @param clazz the class to check
	     * @return the user-defined class
	     */
	    public static Class<?> getUserClass(Class<?> clazz) {
	        if (clazz != null && clazz.getName().contains(CGLIB_CLASS_SEPARATOR)) {
	            Class<?> superClass = clazz.getSuperclass();
	            if (superClass != null && !Object.class.equals(superClass)) {
	                return superClass;
	            }
	        }
	        return clazz;
	    }
	
	    /**
	     * Given a method, which may come from an interface, and a target class used
	     * in the current reflective invocation, find the corresponding target method
	     * if there is one. E.g. the method may be {@code IFoo.bar()} and the
	     * target class may be {@code DefaultFoo}. In this case, the method may be {@code DefaultFoo.bar()}. This enables
	     * attributes on that method to be found.
	     * <p>
	     * <b>NOTE:</b> In contrast to {@link org.springframework.aop.support.AopUtils#getMostSpecificMethod}, this method
	     * does <i>not</i> resolve Java 5 bridge methods automatically. Call
	     * {@link org.springframework.core.BridgeMethodResolver#findBridgedMethod} if bridge method resolution is desirable
	     * (e.g. for obtaining metadata from the original method definition).
	     * <p>
	     * <b>NOTE:</b> Since Spring 3.1.1, if Java security settings disallow reflective access (e.g. calls to
	     * {@code Class#getDeclaredMethods} etc, this implementation will fall back to returning the originally provided
	     * method.
	     * 
	     * @param method the method to be invoked, which may come from an interface
	     * @param targetClass the target class for the current invocation.
	     *            May be {@code null} or may not even implement the method.
	     * @return the specific target method, or the original method if the {@code targetClass} doesn't implement it or is
	     *         {@code null}
	     */
	    public static Method getMostSpecificMethod(Method method, Class<?> targetClass) {
	        if (method != null && isOverridable(method, targetClass) &&
	                targetClass != null && !targetClass.equals(method.getDeclaringClass())) {
	            try {
	                if (Modifier.isPublic(method.getModifiers())) {
	                    try {
	                        return targetClass.getMethod(method.getName(), method.getParameterTypes());
	                    } catch (NoSuchMethodException ex) {
	                        return method;
	                    }
	                }
	                else {
	                    Method specificMethod = findMethod(targetClass, method.getName(), method.getParameterTypes());
	                    return (specificMethod != null ? specificMethod : method);
	                }
	            } catch (AccessControlException ex) {
	                // Security settings are disallowing reflective access; fall back to 'method' below.
	            }
	        }
	        return method;
	    }
	
	    /**
	     * Attempt to find a {@link Method} on the supplied class with the supplied name
	     * and parameter types. Searches all superclasses up to <code>Object</code>.
	     * <p>
	     * Returns <code>null</code> if no {@link Method} can be found.
	     * 
	     * @param clazz the class to introspect
	     * @param name the name of the method
	     * @param paramTypes the parameter types of the method
	     *            (may be <code>null</code> to indicate any signature)
	     * @return the Method object, or <code>null</code> if none found
	     */
	    private static Method findMethod(Class clazz, String name, Class[] paramTypes) {
	        Assert.notNull(clazz, "Class must not be null");
	        Assert.notNull(name, "Method name must not be null");
	        Class searchType = clazz;
	        while (!Object.class.equals(searchType) && searchType != null) {
	            Method[] methods = (searchType.isInterface() ? searchType.getMethods() : searchType.getDeclaredMethods());
	            for (int i = 0; i < methods.length; i++) {
	                Method method = methods[i];
	                if (name.equals(method.getName()) &&
	                        (paramTypes == null || Arrays.equals(paramTypes, method.getParameterTypes()))) {
	                    return method;
	                }
	            }
	            searchType = searchType.getSuperclass();
	        }
	        return null;
	    }
	
	    /**
	     * Determine the name of the package of the given class:
	     * e.g. "java.lang" for the <code>java.lang.String</code> class.
	     * 
	     * @param clazz the class
	     * @return the package name, or the empty String if the class
	     *         is defined in the default package
	     */
	    private static String getPackageName(Class<?> clazz) {
	        Assert.notNull(clazz, "Class must not be null");
	        String className = clazz.getName();
	        int lastDotIndex = className.lastIndexOf(PACKAGE_SEPARATOR);
	        return (lastDotIndex != -1 ? className.substring(0, lastDotIndex) : "");
	    }
	
	    /**
	     * Determine whether the given method is overridable in the given target class.
	     * 
	     * @param method the method to check
	     * @param targetClass the target class to check against
	     */
	    private static boolean isOverridable(Method method, Class targetClass) {
	        if (Modifier.isPrivate(method.getModifiers())) {
	            return false;
	        }
	        if (Modifier.isPublic(method.getModifiers()) || Modifier.isProtected(method.getModifiers())) {
	            return true;
	        }
	        return getPackageName(method.getDeclaringClass()).equals(getPackageName(targetClass));
	    }
	
	
	}
	
	
配置文件：

	<?xml version="1.0" encoding="UTF-8"?>
	<beans xmlns="http://www.springframework.org/schema/beans" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	    xmlns:context="http://www.springframework.org/schema/context"
	    xmlns:task="http://www.springframework.org/schema/task"
	    xmlns:aop="http://www.springframework.org/schema/aop"
	    xmlns:tx="http://www.springframework.org/schema/tx"
	    xsi:schemaLocation="http://www.springframework.org/schema/beans  
	    http://www.springframework.org/schema/beans/spring-beans-2.5.xsd  
	    http://www.springframework.org/schema/context  
	    http://www.springframework.org/schema/context/spring-context-2.5.xsd
	    http://www.springframework.org/schema/task
		http://www.springframework.org/schema/task/spring-task.xsd
	                     http://www.springframework.org/schema/tx 
	                     http://www.springframework.org/schema/tx/spring-tx.xsd 
	                     http://www.springframework.org/schema/aop 
	                     http://www.springframework.org/schema/aop/spring-aop.xsd"
	    default-lazy-init="true">
		<!-- 事务支持 -->
	    <tx:annotation-driven transaction-manager="transactionManager"  />
	    <bean id="transactionManager"
	        class="com.test.jade.transaction.datasource.DynamicDataSourceTransactionManager">
	        <property name="daynamicDataSource" ref="daynamicDataSource" />
	    </bean> 
	    <bean id="daynamicDataSource" class="com.test.jade.transaction.datasource.DynamicDataSource">
	        <property name="jadeDataSourceFactory" ref="jade.dataSourceFactory" />
	        <property name="defaultCatelog" value="newsfeed_v2" /><!-- 默认的catelog -->
	    </bean>
	   
	     <!-- jade事务拦截器支持 -->
	    <bean class="com.test.jade.transaction.Interceptor.JadeTransactionalAdvisor"></bean>
	    <context:component-scan base-package="com.test.jade.transaction">
	        <context:include-filter type="regex"
	            expression=".*Interceptor" />
	    </context:component-scan>
	     <bean class="org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator">
	        <property name="proxyTargetClass" value="true"/>
	    </bean>
	</beans>

以上是完整代码。
