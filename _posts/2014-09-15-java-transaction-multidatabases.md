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




获取的是本类中定义的方法，不包括父类中的。

