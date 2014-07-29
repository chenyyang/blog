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
		
		<root>
			<level value="${root_log4j_level}" />
			<appender-ref ref="stdout" />
		</root>	
最终子文件的log会调用两个appender，自己的和root的，即使root中的level是error，而自己打的log是info，也会在stdout中打出来，因为只是用了root中的appender－ref。
