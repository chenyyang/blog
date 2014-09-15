---
layout: default
title:  事务数据源处理分析
categories:
  - java

---
# {{ page.title }}

##1. 数据源

数据源：简而言之就是DataSource对象。

##2. DataSourceTransactionManager分析

	//数据源
	private DataSource dataSource;

	public void setDataSource(DataSource dataSource) {
		if (dataSource instanceof TransactionAwareDataSourceProxy) {
			this.dataSource = ((TransactionAwareDataSourceProxy) dataSource).getTargetDataSource();
		}
		else {
			this.dataSource = dataSource;
		}
	}

	public DataSource getDataSource() {
		return this.dataSource;
	}

上面是关于属性dataSource的方法，如果希望支持多数据源，需要重写getDataSource()方法。

	//构造函数中调用这个方法，用来检查dataSource是否为空
	public void afterPropertiesSet() {
		if (getDataSource() == null) {
			throw new IllegalArgumentException("Property 'dataSource' is required");
		}
	}

构造函数最后会调用这个方法。加上一些检测方法，这里只检查了getDataSource()返回的结果是否为空。

	//doBegin之前调用，
	protected Object doGetTransaction() {
		//新建一个DataSourceTransactionObject，这个对象会贯穿整个事务线程
		DataSourceTransactionObject txObject = new DataSourceTransactionObject();
		txObject.setSavepointAllowed(isNestedTransactionAllowed());
		//此时返回的是null，TransactionSynchronizationManager是基于线程安全的记录resource的抽象类，里面有很多静态方法是经常使用的
		ConnectionHolder conHolder =
		    (ConnectionHolder) TransactionSynchronizationManager.getResource(this.dataSource);
		txObject.setConnectionHolder(conHolder, false);
		return txObject;
	}

doGetTransaction()会在doBegin之前调用，此处会创建一个DataSourceTransactionObject对象，这个对象就是代表这个事务的对象。

	protected void doBegin(Object transaction, TransactionDefinition definition) {
		//doGetTransaction中创建的对象
		DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;
		Connection con = null;

		try {
			//如果为空或者connection被锁上，则创建新的
			if (txObject.getConnectionHolder() == null ||
					txObject.getConnectionHolder().isSynchronizedWithTransaction()) {
				Connection newCon = this.dataSource.getConnection();
				if (logger.isDebugEnabled()) {
					logger.debug("Acquired Connection [" + newCon + "] for JDBC transaction");
				}
				txObject.setConnectionHolder(new ConnectionHolder(newCon), true);
			}
			//把这个connection锁上
			txObject.getConnectionHolder().setSynchronizedWithTransaction(true);
			con = txObject.getConnectionHolder().getConnection();

			Integer previousIsolationLevel = DataSourceUtils.prepareConnectionForTransaction(con, definition);
			txObject.setPreviousIsolationLevel(previousIsolationLevel);

			//设置自动提交为false，否则mql会自动commit，事务就不能回滚了
			if (con.getAutoCommit()) {
				txObject.setMustRestoreAutoCommit(true);
				if (logger.isDebugEnabled()) {
					logger.debug("Switching JDBC Connection [" + con + "] to manual commit");
				}
				con.setAutoCommit(false);
			}
			txObject.getConnectionHolder().setTransactionActive(true);

			int timeout = determineTimeout(definition);
			if (timeout != TransactionDefinition.TIMEOUT_DEFAULT) {
				txObject.getConnectionHolder().setTimeoutInSeconds(timeout);
			}

			// 绑定getDataSource()返回的值和connection到当前线程
			if (txObject.isNewConnectionHolder()) {
				TransactionSynchronizationManager.bindResource(getDataSource(), txObject.getConnectionHolder());
			}
		}

		catch (SQLException ex) {
			DataSourceUtils.releaseConnection(con, this.dataSource);
			throw new CannotCreateTransactionException("Could not open JDBC Connection for transaction", ex);
		}
	}

doBegin处理了一些事务的准备工作，比如dataSource的创建和设置。

	protected void doCommit(DefaultTransactionStatus status) {
		DataSourceTransactionObject txObject = (DataSourceTransactionObject) status.getTransaction();
		//获取连接
		Connection con = txObject.getConnectionHolder().getConnection();
		if (status.isDebug()) {
			logger.debug("Committing JDBC transaction on Connection [" + con + "]");
		}
		try {
			//提交事务，此处sql语句会被执行
			con.commit();
		}
		catch (SQLException ex) {
			throw new TransactionSystemException("Could not commit JDBC transaction", ex);
		}
	}

当业务逻辑顺利执行结束后，会调用doCommit方法，此时数据库的操作才会真正的被执行。

	protected void doRollback(DefaultTransactionStatus status) {
		DataSourceTransactionObject txObject = (DataSourceTransactionObject) status.getTransaction();
		//获取连接
		Connection con = txObject.getConnectionHolder().getConnection();
		if (status.isDebug()) {
			logger.debug("Rolling back JDBC transaction on Connection [" + con + "]");
		}
		try {
			//数据库回滚，前面的sql不会被执行
			con.rollback();
		}
		catch (SQLException ex) {
			throw new TransactionSystemException("Could not roll back JDBC transaction", ex);
		}
	}

如果业务逻辑没有执行成功，则调用doRollback，con.commit()不会被执行，con.rollback()会被执行。

	protected void doCleanupAfterCompletion(Object transaction) {
		DataSourceTransactionObject txObject = (DataSourceTransactionObject) transaction;

		// 接触dataSource和当前线程的绑定
		if (txObject.isNewConnectionHolder()) {
			TransactionSynchronizationManager.unbindResource(this.dataSource);
		}

		// 获取连接,并把连接中的设置reset
		Connection con = txObject.getConnectionHolder().getConnection();
		try {
			if (txObject.isMustRestoreAutoCommit()) {
				con.setAutoCommit(true);
			}
			DataSourceUtils.resetConnectionAfterTransaction(con, txObject.getPreviousIsolationLevel());
		}
		catch (Throwable ex) {
			logger.debug("Could not reset JDBC Connection after transaction", ex);
		}
		//释放连接
		if (txObject.isNewConnectionHolder()) {
			if (logger.isDebugEnabled()) {
				logger.debug("Releasing JDBC Connection [" + con + "] after transaction");
			}
			DataSourceUtils.releaseConnection(con, this.dataSource);
		}

		txObject.getConnectionHolder().clear();
	}

不管成功或者失败，最后都会调用doCleanupAfterCompletion，用于清楚一些设置，例如释放连接、解除绑定等。

DataSourceUtils.releaseConnection方法负责close：

	public static void doReleaseConnection(Connection con, DataSource dataSource) throws SQLException {
		if (con == null) {
			return;
		}

		if (dataSource != null) {
			//因为已经解除了绑定，所以取到的是空，所以不会走下面的if逻辑
			ConnectionHolder conHolder = (ConnectionHolder) TransactionSynchronizationManager.getResource(dataSource);
			if (conHolder != null && connectionEquals(conHolder, con)) {
				// It's the transactional Connection: Don't close it.
				conHolder.released();
				return;
			}
		}

		//如果可以被关闭，之前的代码没有设置不能关闭，所以会执行到这一段代码
		if (!(dataSource instanceof SmartDataSource) || ((SmartDataSource) dataSource).shouldClose(con)) {
			logger.debug("Returning JDBC Connection to DataSource");
			con.close();
		}
	}

最终会跑到con.close()，如果没有被close，会造成connection回到连接池，之前设置的con.setAutoCommit(true);没有被重置，所以下面一个非事务的业务拿到这个连接，如果没有显示调用commit，则sql语句永远不会被执行。


获取的是本类中定义的方法，不包括父类中的。

