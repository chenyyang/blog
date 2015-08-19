---
layout: default
title:  disruptor介绍一：使用 
categories:
  - Java

---

# {{ page.title }}

##1. 初始化

    RingBuffer ringBuffer = new RingBuffer<ValueEvent>(ValueEvent.EVENT_FACTORY,
    new SingleThreadedClaimStrategy(RING_SIZE),
    new SleepingWaitStrategy());
    
    SequenceBarrier barrier = ringBuffer.newBarrier();
    
    BatchEventProcessor<ValueEvent> eventProcessor = new BatchEventProcessor<ValueEvent>(ringBuffer, barrier, handler);
    ringBuffer.setGatingSequences(eventProcessor.getSequence());
    // only support single thread  
    new Thread(eventProcessor).start();

这个是单消费者，eventProcessor可以添加多个handler，但是各个handler都会执行。

##2. 缓存数据

    public class ValueEvent {
        private byte[] packet;
    
        public byte[] getValue()
        {
            return packet;
        }
    
        public void setValue(final byte[] packet)
        {
            this.packet = packet;
        }
    
        public final static EventFactory<ValueEvent> EVENT_FACTORY = new EventFactory<ValueEvent>()
        {
            public ValueEvent newInstance()
            {
                return new ValueEvent();
            }
        };
    }

需要被缓存的数据

##3. 生产者

    long sequence = ringBuffer.next();
    
    if(ringBuffer.remainingCapacity() < RING_SIZE * 0.1) {
        log.warn("disruptor:ringbuffer avaliable capacity is less than 10 %");
    }
    else {
        ValueEvent event = ringBuffer.get(sequence);
        event.setValue(packet); 
        ringBuffer.publish(sequence);
    }

##4. 消费者

    public class EventWorkHandler implements EventHandler<ValueEvent>{
        public void onEvent(final ValueEvent event, final long sequence, final boolean endOfBatch) throws Exception{
            // do something
        }
    };

上面是但消费者情况，如果是多个消费者并发消费，后面有介绍。
##5. 多消费者

初始化：

producer:

    public class DisruptorUtil {

        private static RingBuffer<ValueEvent> ringBuffer = null;

        public static void initDisruptor(int threadCount) {
            EventFactory<ValueEvent> eventFactory = new EventFactory<ValueEvent>() {
                public ValueEvent newInstance() {
                    return new ValueEvent();
                }
            };
            //存放数据的地方
            ringBuffer = RingBuffer.createMultiProducer(eventFactory, 1024);

            //seq
            SequenceBarrier sequenceBarrier = ringBuffer.newBarrier();

            ExecutorService executor = new ThreadPoolExecutor(threadCount, threadCount * 2, 0, TimeUnit.MILLISECONDS,
                    new LinkedBlockingQueue<Runnable>(10));

            //初始化消费者，每个WorkHandler都是一个消费者
            WorkHandler<ValueEvent>[] workHandlers = new WorkHandler[threadCount];

            for (int i = 0; i < threadCount; i++) {
                workHandlers[i] = new EventWorkHandler(i, threadCount);
            }

            //消费者记录生产者的seq
            WorkerPool<ValueEvent> workerPool = new WorkerPool<ValueEvent>(ringBuffer, sequenceBarrier, new IgnoreExceptionHandler(), workHandlers);
            //记录work的seq，防止生产的seq覆盖work的seq
            ringBuffer.addGatingSequences(workerPool.getWorkerSequences());

            workerPool.start(executor);

        }

        public static void publishEvent(ChannelHandlerContext ctx, int age) {
            long seq = ringBuffer.next();
            try {
                ValueEvent valueEvent = ringBuffer.get(seq);
                valueEvent.setAge(age);
            } finally {
                ringBuffer.publish(seq);
            }
        }
    }

Event:

    public class ValueEvent {
    
        private int age;
    
        public int getAge() {
            return age;
        }
    
        public void setAge(int age) {
            this.age = age;
        }
    }

Consumer:

    public class EventWorkHandler implements EventHandler<ValueEvent>,WorkHandler<ValueEvent> {

        int index;

        int numberOfConsumers;

        private static final Logger logger = LoggerFactory.getLogger(EventWorkHandler.class);

        public EventWorkHandler(int index,int numberOfConsumers) {
            this.index = index;
            this.numberOfConsumers = numberOfConsumers;
        }

        @Override
        public void onEvent(ValueEvent event, long sequence, boolean endOfBatch) throws Exception {
            this.onEvent(event);
        }

        @Override
        public void onEvent(ValueEvent event) throws Exception {
            //todo
        }
    }

上面是所有的多消费者代码，而且是并发消费。
