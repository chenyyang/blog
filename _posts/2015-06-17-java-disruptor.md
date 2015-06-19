---
layout: default
title:  disruptor源码介绍一：参数介绍 
categories:
  - Java

---

# {{ page.title }}


##1. RingBuffer

    /**
     *  核心类：RingBuffer
     *  功 能： 放新内容，存所有内容
     */
    abstract class RingBufferPad
    {
        protected long p1, p2, p3, p4, p5, p6, p7;
    }
    
    abstract class RingBufferFields<E> extends RingBufferPad//中间存储,通过这个publish新的内容
    {
        private final long indexMask;       //数组的最大index
        private final Object[]entries;      //真正的放内容的数组
        protected final int bufferSize;     //数组的size
        protected final Sequencer sequencer;//＝生产者AbstractSequencer
    }
    
    public final class RingBuffer<E> extends RingBufferFields<E> implements Cursored, EventSequencer<E>, EventSink<E> {
    }

RingBuffer里面存放的是内容实体，entries在最开始会被初始化，new entry。并且消费了的entry不会取出来，只会被覆盖。

##2. Sequencer

    /**
     *  核心类：AbstractSequencer，派生SingleProducerSequencer、MultiProducerSequencer等生产者
     *  功 能： 封装了安全放内容到数组中
     */
    public abstract class AbstractSequencer implements Sequencer
    {
        protected final int bufferSize;  //生产者的buffer size
        protected final WaitStrategy waitStrategy;   //等待生产者的策略，参数二
        protected final Sequence cursor = new Sequence(Sequencer.INITIAL_CURSOR_VALUE); //记录生产者的生产到哪的计数器，参数一
        protected volatile Sequence[] gatingSequences = new Sequence[0];//需要监听的消费者计数器
    }

AbstractSequencer是所有生产者的父类，生产者会等待gatingSequences都大于cursor才会往里面放数据

##3. WorkProcessor

    /**
     *  核心类：WorkProcessor，消费者，多消费者用此类
     *  功 能： 消费
     */
    public final class WorkProcessor<T> implements EventProcessor//消费者
    {
        private final AtomicBoolean running = new AtomicBoolean(false);    //是否在running
        private final Sequence sequence = new Sequence(Sequencer.INITIAL_CURSOR_VALUE);  //gatingSequences里面包含这个，当前消费者最近消费结束了index的计数器
        private final RingBuffer<T> ringBuffer;             //＝ringBuffer，里面存储了环的内容
        private final SequenceBarrier sequenceBarrier;      //＝ProcessingSequenceBarrier，记录ringBuffer到哪了，并且提供等待的方法，封装了等待的策略
        private final WorkHandler<? super T> workHandler;             //正常业务的处理
        private final ExceptionHandler<? super T> exceptionHandler;   //异常的处理
        private final Sequence workSequence;               //gatingSequences里面包含这个，所有的work指向一个，表示最近拿到了的位置的计数器，可能这个位置消费了，也可能还没消费，不过已经被占用了
    }

消费者类有很多，WorkProcessor用户并发消费的多消费者情况。

##4. SequenceBarrier


    /**
     *  核心类：ProcessingSequenceBarrier，生产者和消费者index放入和取出的桥梁
     *  功 能： 取新的index给消费者，
     */
    final class ProcessingSequenceBarrier implements SequenceBarrier
    {
        private final WaitStrategy waitStrategy;   //等待新事件的策略＝参数二
        private final Sequence dependentSequence;  //额外的计数器（sequence）
        private volatile boolean alerted = false;  //
        private final Sequence cursorSequence;     //生产者生产到哪的计数器＝参数一
        private final Sequencer sequencer;         //＝生产者AbstractSequencer
    }

SequenceBarrier里面含有生产者的消费者的坐标，用来计算下一个消费者应该消费的坐标。WaitStrategy是核心算法类，用来取可以用的坐标。
