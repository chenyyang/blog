---
layout: default
title:  log4j additivity
categories:
  - others

---
# {{ page.title }}

dditivity的作用在于 children-logger是否使用 rootLogger配置的appender进行输出。

false：表示只用当前logger的appender-ref。

true：表示当前logger的appender-ref和rootLogger的appender-ref都有效。
		
		<appender name="stdout" class="org.apache.log4j.ConsoleAppender">
			<param name="Target" value="System.out" />
			<layout class="org.apache.log4j.PatternLayout">
				<param name="ConversionPattern" value="[%-5p %d{yyyy-MM-dd HH:mm:ss.SSS}] %l [%m]%n" />
			</layout>
		</appender>
		<appender name="scribe" class="com.test.access.log4j.AccessAppender">
	  		<param name="encoding" value="utf-8" />
	   		<param name="scribeHost" value="${scribe_host}" />
	  		<param name="scribePort" value="${scribe_port}" />
	  		<param name="scribeCategory" value="${scribe_cates}" />
	   		<layout class="org.apache.log4j.PatternLayout">
	       		 <param name="ConversionPattern" value="%d{yyyy-MM-dd HH:mm:ss},%m %n" />
	   			</layout>
	  		 <param name="showIp" value="true" />
		</appender>
		<logger name="com.test.LogUtils.ScribeAdapter" additivity="true">
			<level value="info" />
			<appender-ref ref="scribe" />
		</logger>
		<root>
			<level value="${root_log4j_level}" />
			<appender-ref ref="stdout" />
		</root>	

最终子文件的log会调用两个appender，scribe和root的stdout，即使root中的level是error，而自己打的log是info，也会在stdout中打出来，因为只是用了root中的appender－ref。
