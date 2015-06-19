---
layout: default
title:  disruptor介绍二：压测  
categories:
  - Java

---

# {{ page.title }}


##1. 压测

Disruptor的YidldingWaitStrategy模式消耗cpu特别严重。

压测的表格如下，P1-C1表示一个生产者，一个消费者。

<table>
<tr><td>条件\压测目标</td><td>BlockingWaitStrategy</td><td>SleepingWaitStrategy</td><td>ThreadPoolExecutor</td>
</tr>
<tr>
<td>P1-C1</td><td>2100万</td><td>2100万（141cpu，0.98load）</td><td>350万</td>
</tr>
<tr>
<td>P1-C2</td><td>1600万</td><td>2100万（270+cpu,2.7 load）</td><td>500万</td>
</tr>
<tr>
<td>P1-C4</td><td>1000万</td><td>1200万（440+cpu,3.3 load）</td><td>660万</td>
</tr>
<tr>
<td>P1-C8</td><td>350万</td><td>900万（620+cpu,3.4 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C16</td><td>2100万</td><td>780万（700+cpu,3.4 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C32</td><td>120万</td><td>440万（740+cpu,4 load）</td><td>700万</td>
</tr>
<tr>
<td>P1-C64</td><td>60万</td><td>290万（740+cpu,6 load）</td><td>720万</td>
</tr>
<tr>
<td>P1-C128</td><td>30万</td><td>136万（784+cpu,15 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C256</td><td>9万</td><td>54万 (600+cpu,200 load) </td><td>700万</td>
</tr>
</table>

从表格可以看出Disruptor在consumer多的情况下并不理想，ThreadPoolExecutor相对比较稳定。

##2. 代码分析

    public final class BlockingWaitStrategy implements WaitStrategy
    {
        private final Lock lock = new ReentrantLock();
        private final Condition processorNotifyCondition = lock.newCondition();

        //consumer取数据的时候调用
        @Override
        public long waitFor(long sequence, Sequence cursorSequence, Sequence dependentSequence, SequenceBarrier barrier)
                throws AlertException, InterruptedException
        {
            long availableSequence;
            if ((availableSequence = cursorSequence.get()) < sequence)
            {
                //此处有锁
                lock.lock();
                try
                {
                    while ((availableSequence = cursorSequence.get()) < sequence)
                    {
                        barrier.checkAlert();
                        processorNotifyCondition.await();//qps低的关键地方，大部分consumer线程wait在这里
                    }
                }
                finally
                {
                    lock.unlock();
                }
            }

            while ((availableSequence = dependentSequence.get()) < sequence)
            {
                barrier.checkAlert();
            }

            return availableSequence;
        }

        //producer放数据的时候调用
        @Override
        public void signalAllWhenBlocking()
        {
            //此处有锁
            lock.lock();
            try
            {
                processorNotifyCondition.signalAll();//qps低的关键地方，大部分production线程wait在这里
            }
            finally
            {
                lock.unlock();
            }
        }
    }


通过上面可以看出BlockingWaitStrategy不管在方数据还是在取数据的时候都是有锁的。另外大部分线程包括生产者和消费者都在wait。
