---
layout: default
title:  log4j AsyncAppender
categories:
  - java

---
# {{ page.title }}

org.apache.log4j里面的AsyncAppender类用户异步输出日志。

##1. 配置

    <appender name="DRFOUT" class="org.apache.log4j.DailyRollingFileAppender">
       <param name="File" value="logs/brws.log" />
       <param name="Append" value="true" />
       <param name="DatePattern" value="yyyy_MM_dd'.'" />
       <layout class="org.apache.log4j.PatternLayout">
          <param name="ConversionPattern" value="%d [%t] %-5p %l %x - %m%n" />
       </layout>
    </appender>
    
    <appender name="ASYNCOUT" class="org.apache.log4j.AsyncAppender">
       <param name="BufferSize" value="512" />
       <appender-ref ref="DRFOUT" />
    </appender>

appender-ref需要指到一个appender，最终还是通过这个appender打印到file里面。


##2. 压测

<table>
<tr><td>结果\条件 </td><td> DailyRollingFileAppender </td><td> AsyncAppender</td>
</tr>
<tr>
<td>QPS</td><td> 10万</td><td> 22万</td></tr>
<tr>
<td>CPU</td><td> 170%</td><td> 125%</td></tr>
<tr>
<td>MEM</td><td> 27.2%</td><td> 27.3%</td></tr>
<tr>
<td>LOAD</td><td> 0.25</td><td> 1.2</td></tr>
</table>

async确实提高了qps，但是load也上升不少。

##3. 源码解析

    public class AsyncAppender extends AppenderSkeleton
            implements AppenderAttachable {
        //默认缓存大小是128
        public static final int DEFAULT_BUFFER_SIZE = 128;

        //本地buffer
        private final List buffer = new ArrayList();

        //buffer不够用的时候会用上discardMap
        private final Map discardMap = new HashMap();

        //Buffer size. 此处的size是log次数
        private int bufferSize = DEFAULT_BUFFER_SIZE;

        /** Nested appenders. */
        AppenderAttachableImpl aai;

        // appender-ref 配置里面对应的值
        private final AppenderAttachableImpl appenders;

        // Dispatcher.异步打log的线程
        private final Thread dispatcher;

        //是否需要详细的location信息，类的名字行号等
        private boolean locationInfo = false;

        //如果buffer满了，是否block线程
        private boolean blocking = true;

        /**
         * {@inheritDoc}
         */
        public void append(final LoggingEvent event) {
            //
            //   if dispatcher thread has died then
            //      append subsequent events synchronously
            //   See bug 23021
            if ((dispatcher == null) || !dispatcher.isAlive() || (bufferSize <= 0)) {
                synchronized (appenders) {
                    appenders.appendLoopOnAppenders(event);
                }

                return;
            }

            // Set the NDC and thread name for the calling thread as these
            // LoggingEvent fields were not set at event creation time.
            event.getNDC();
            event.getThreadName();
            // Get a copy of this thread's MDC.
            event.getMDCCopy();
            if (locationInfo) {
                event.getLocationInformation();
            }

            synchronized (buffer) {
                while (true) {
                    int previousSize = buffer.size();

                    if (previousSize < bufferSize) {
                        buffer.add(event);
                        if (previousSize == 0) {
                            buffer.notifyAll();
                        }

                        break;
                    }

                    boolean discard = true;
                    if (blocking
                            && !Thread.interrupted()
                            && Thread.currentThread() != dispatcher) {
                        try {
                            buffer.wait();
                            discard = false;
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }

                    //意外中止
                    if (discard) {
                        String loggerName = event.getLoggerName();
                        DiscardSummary summary = (DiscardSummary) discardMap.get(loggerName);

                        if (summary == null) {
                            summary = new DiscardSummary(event);
                            discardMap.put(loggerName, summary);
                        } else {
                            summary.add(event);
                        }

                        break;
                    }
                }
            }
        }


        /**
         * Event dispatcher.
         */
        private static class Dispatcher implements Runnable {
            public void run() {
                boolean isActive = true;

                try {
                    while (isActive) {
                        LoggingEvent[] events = null;

                        synchronized (buffer) {
                            int bufferSize = buffer.size();
                            isActive = !parent.closed;

                            while ((bufferSize == 0) && isActive) {
                                buffer.wait();
                                bufferSize = buffer.size();
                                isActive = !parent.closed;
                            }

                            if (bufferSize > 0) {
                                events = new LoggingEvent[bufferSize + discardMap.size()];
                                buffer.toArray(events);
                                int index = bufferSize;

                                for (
                                        Iterator iter = discardMap.values().iterator();
                                        iter.hasNext();) {
                                    events[index++] = ((DiscardSummary) iter.next()).createEvent();
                                }

                                buffer.clear();
                                discardMap.clear();

                                buffer.notifyAll();
                            }
                        }

                        if (events != null) {
                            for (int i = 0; i < events.length; i++) {
                                synchronized (appenders) {
                                    appenders.appendLoopOnAppenders(events[i]);
                                }
                            }
                        }
                    }
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }


上面是源码，创建一个Dispatcher的线程，用户异步打日志，一次性从buffer里面取出，并且置空，然后通知其他wait的线程。discardMap在线程意外中止的时候存储log。
