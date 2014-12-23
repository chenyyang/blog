---
layout: default
title:  java netty之channel
categories:
  - java

---
# {{ page.title }}

本例子讲解server从启动监听到最终建立链接的过程。首先是server创建端口监听，接着接受请求事件，最后建立链接并监听链接。

![大概的类图](/blog/image/netty-channel.jpg)

##1. server启动代码：

    public final class SocksServer {
    
    	public static void main(String[] args) throws Exception {
    	    //用于管理链接的线程池
    		EventLoopGroup bossGroup = new NioEventLoopGroup(1);
    		//用于管理数据接受的线程池
    		EventLoopGroup workerGroup = new NioEventLoopGroup();
    		try {
    			ServerBootstrap b = new ServerBootstrap();
    			b.group(bossGroup, workerGroup).channel(NioServerSocketChannel.class).childHandler(new SocksServerInitializer());
    			//bind是关键方法，包括channel的init和register
    			b.bind(Constants.Socks.PORT).sync().channel().closeFuture().sync();
    		} finally {
    			bossGroup.shutdownGracefully();
    			workerGroup.shutdownGracefully();
    		}
    	}
    }

如上是启动方式，其中bind方法是核心。

##2. AbstractBootstrap.doBind方法

    private ChannelFuture doBind(final SocketAddress localAddress) {
        // initAndRegister() 中包括channel的初始化（根据设置的channel class new反射的），和register,
        // register包括选择线程池里面的一个线程，channel注册到此线程的selector
        final ChannelFuture regFuture = initAndRegister();
        final Channel channel = regFuture.channel();
        if (regFuture.cause() != null) {
            return regFuture;
        }

        if (regFuture.isDone()) {
            // At this point we know that the registration was complete and succesful.
            ChannelPromise promise = channel.newPromise();
            // doBind0是负责server端口
            // 检索与此通道关联的服务器套接字
            // ServerSocket serverSocket = serverSocketChannel.socket();
            // 进行服务的绑定
            // serverSocket.bind(new InetSocketAddress(port));
            doBind0(regFuture, channel, localAddress, promise);
            return promise;
        } else {
            // ...
            return promise;
        }
    }

    final ChannelFuture initAndRegister() {
        final Channel channel = channelFactory().newChannel();
        try {
            init(channel);
        } catch (Throwable t) {
            channel.unsafe().closeForcibly();
            // as the Channel is not registered yet we need to force the usage of the GlobalEventExecutor
            return new DefaultChannelPromise(channel, GlobalEventExecutor.INSTANCE).setFailure(t);
        }

        ChannelFuture regFuture = group().register(channel);
        if (regFuture.cause() != null) {
            if (channel.isRegistered()) {
                channel.close();
            } else {
                channel.unsafe().closeForcibly();
            }
        }
        return regFuture;
    }

如上代码，如上代码拆分可见，重点方法init-->register-->doBind0。

init方法主要是channel 中handler的设置。<br>
register主要是注册到线程池。<br>
doBind0主要是套接字的绑定。<br>

##3. init方法

    void init(Channel channel) throws Exception {
        final Map<ChannelOption<?>, Object> options = options();
        synchronized (options) {
            channel.config().setOptions(options);
        }

        final Map<AttributeKey<?>, Object> attrs = attrs();
        synchronized (attrs) {
            for (Entry<AttributeKey<?>, Object> e: attrs.entrySet()) {
                @SuppressWarnings("unchecked")
                AttributeKey<Object> key = (AttributeKey<Object>) e.getKey();
                channel.attr(key).set(e.getValue());
            }
        }

        ChannelPipeline p = channel.pipeline();
        if (handler() != null) {
            p.addLast(handler());
        }

        final EventLoopGroup currentChildGroup = childGroup;
        final ChannelHandler currentChildHandler = childHandler;
        final Entry<ChannelOption<?>, Object>[] currentChildOptions;
        final Entry<AttributeKey<?>, Object>[] currentChildAttrs;
        synchronized (childOptions) {
            currentChildOptions = childOptions.entrySet().toArray(newOptionArray(childOptions.size()));
        }
        synchronized (childAttrs) {
            currentChildAttrs = childAttrs.entrySet().toArray(newAttrArray(childAttrs.size()));
        }

        p.addLast(new ChannelInitializer<Channel>() {
            @Override
            public void initChannel(Channel ch) throws Exception {
                ch.pipeline().addLast(new ServerBootstrapAcceptor(
                        currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
            }
        });
    }

init方法主要是p.addLast两个handler，handler()如果设置了则会监听整个channel的生命周期，hander2是一个匿名内部类，ServerBootstrapAcceptor方法是主要内容。<br>
ServerBootstrapAcceptor里面是链接初始化类，包括客户端过来的链接的线程分配和注册selector。

##4. register方法会执行对于的AbstractNioChannel.doRegister()方法

    protected void doRegister() throws Exception {
        boolean selected = false;
        for (;;) {
            try {
                selectionKey = javaChannel().register(eventLoop().selector, 0, this);
                return;
            } catch (CancelledKeyException e) {
                if (!selected) {
                    eventLoop().selectNow();
                    selected = true;
                } else {
                    throw e;
                }
            }
        }
    }

如上，javaChannel()获取封装的java channel，注册到对应的selector。这样在线程在轮训selector.select就可以监听到channel的事件,并且带上了channel的信息。

##5. selector.select监听到事件，就执行channel的read方法。

    private final class NioMessageUnsafe extends AbstractNioUnsafe {

        private final List<Object> readBuf = new ArrayList<Object>();

        @Override
        public void read() {
            assert eventLoop().inEventLoop();
            final ChannelConfig config = config();
            if (!config.isAutoRead() && !isReadPending()) {
                // ChannelConfig.setAutoRead(false) was called in the meantime
                removeReadOp();
                return;
            }

            final int maxMessagesPerRead = config.getMaxMessagesPerRead();
            final ChannelPipeline pipeline = pipeline();
            boolean closed = false;
            Throwable exception = null;
            try {
                try {
                    for (;;) {
                        int localRead = doReadMessages(readBuf);
                        if (localRead == 0) {
                            break;
                        }
                        if (localRead < 0) {
                            closed = true;
                            break;
                        }

                        // stop reading and remove op
                        if (!config.isAutoRead()) {
                            break;
                        }

                        if (readBuf.size() >= maxMessagesPerRead) {
                            break;
                        }
                    }
                } catch (Throwable t) {
                    exception = t;
                }
                setReadPending(false);
                int size = readBuf.size();
                for (int i = 0; i < size; i ++) {
                    pipeline.fireChannelRead(readBuf.get(i));
                }

                readBuf.clear();
                pipeline.fireChannelReadComplete();

                if (exception != null) {
                    if (exception instanceof IOException && !(exception instanceof PortUnreachableException)) {
                        // ServerChannel should not be closed even on IOException because it can often continue
                        // accepting incoming connections. (e.g. too many open files)
                        closed = !(AbstractNioMessageChannel.this instanceof ServerChannel);
                    }

                    pipeline.fireExceptionCaught(exception);
                }

                if (closed) {
                    if (isOpen()) {
                        close(voidPromise());
                    }
                }
            } finally {
                // Check if there is a readPending which was not processed yet.
                // This could be for two reasons:
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelRead(...) method
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelReadComplete(...) method
                //
                // See https://github.com/netty/netty/issues/2254
                if (!config.isAutoRead() && !isReadPending()) {
                    removeReadOp();
                }
            }
        }
    }

上面代码重点是doReadMessages，fireChannelRead。

NioServerSocketChannel.doReadMessage:

    protected int doReadMessages(List<Object> buf) throws Exception {
        SocketChannel ch = javaChannel().accept();

        try {
            if (ch != null) {
                buf.add(new NioSocketChannel(this, ch));
                return 1;
            }
        } catch (Throwable t) {
            logger.warn("Failed to create a new channel from an accepted socket.", t);

            try {
                ch.close();
            } catch (Throwable t2) {
                logger.warn("Failed to close a socket.", t2);
            }
        }

        return 0;
    }

javaChannel().accept();会立即返回，因为channel设置non-bocking。

for循环查询accept，知道返回null表示没有链接请求。然后调用pipeline.fireChannelRead(readBuf.get(i))。

accept发挥的java channel封装成了：new NioSocketChannel(this, ch)。

##6.  pipeline中handler只有ServerBootstrapAcceptor，所以fireChannelRead()执行ServerBootstrapAcceptor.channelRead

ServerBootstrapAcceptor:

       public void channelRead(ChannelHandlerContext ctx, Object msg) {
            final Channel child = (Channel) msg;

            child.pipeline().addLast(childHandler);

            for (Entry<ChannelOption<?>, Object> e: childOptions) {
                try {
                    if (!child.config().setOption((ChannelOption<Object>) e.getKey(), e.getValue())) {
                        logger.warn("Unknown channel option: " + e);
                    }
                } catch (Throwable t) {
                    logger.warn("Failed to set a channel option: " + child, t);
                }
            }

            for (Entry<AttributeKey<?>, Object> e: childAttrs) {
                child.attr((AttributeKey<Object>) e.getKey()).set(e.getValue());
            }

            try {
                childGroup.register(child).addListener(new ChannelFutureListener() {
                    @Override
                    public void operationComplete(ChannelFuture future) throws Exception {
                        if (!future.isSuccess()) {
                            forceClose(child, future.cause());
                        }
                    }
                });
            } catch (Throwable t) {
                forceClose(child, t);
            }
        }

childGroup.register方法是重点，child是封装了channel对象的NioSocketChannel。

childGroup.register和之前注册到线程池相似，只是线程在遍历的时候调用的read方法，会进入AbstractNioByteChannel.NioByteUnsafe.read

##7.  NioSocketChannel的read方法:AbstractNioByteChannel.NioByteUnsafe.read

        public void read() {
            final ChannelConfig config = config();
            if (!config.isAutoRead() && !isReadPending()) {
                // ChannelConfig.setAutoRead(false) was called in the meantime
                removeReadOp();
                return;
            }

            final ChannelPipeline pipeline = pipeline();
            final ByteBufAllocator allocator = config.getAllocator();
            final int maxMessagesPerRead = config.getMaxMessagesPerRead();
            RecvByteBufAllocator.Handle allocHandle = this.allocHandle;
            if (allocHandle == null) {
                this.allocHandle = allocHandle = config.getRecvByteBufAllocator().newHandle();
            }

            ByteBuf byteBuf = null;
            int messages = 0;
            boolean close = false;
            try {
                int totalReadAmount = 0;
                boolean readPendingReset = false;
                do {
                    byteBuf = allocHandle.allocate(allocator);
                    int writable = byteBuf.writableBytes();
                    int localReadAmount = doReadBytes(byteBuf);
                    if (localReadAmount <= 0) {
                        // not was read release the buffer
                        byteBuf.release();
                        close = localReadAmount < 0;
                        break;
                    }
                    if (!readPendingReset) {
                        readPendingReset = true;
                        setReadPending(false);
                    }
                    pipeline.fireChannelRead(byteBuf);
                    byteBuf = null;

                    if (totalReadAmount >= Integer.MAX_VALUE - localReadAmount) {
                        // Avoid overflow.
                        totalReadAmount = Integer.MAX_VALUE;
                        break;
                    }

                    totalReadAmount += localReadAmount;

                    // stop reading
                    if (!config.isAutoRead()) {
                        break;
                    }

                    if (localReadAmount < writable) {
                        // Read less than what the buffer can hold,
                        // which might mean we drained the recv buffer completely.
                        break;
                    }
                } while (++ messages < maxMessagesPerRead);

                pipeline.fireChannelReadComplete();
                allocHandle.record(totalReadAmount);

                if (close) {
                    closeOnRead(pipeline);
                    close = false;
                }
            } catch (Throwable t) {
                handleReadException(pipeline, byteBuf, t, close);
            } finally {
                // Check if there is a readPending which was not processed yet.
                // This could be for two reasons:
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelRead(...) method
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelReadComplete(...) method
                //
                // See https://github.com/netty/netty/issues/2254
                if (!config.isAutoRead() && !isReadPending()) {
                    removeReadOp();
                }
            }
        }
    }

主要的两个方法是doReadBytes和pipeline.fireChannelRead。doReadBytes是读取channel的数据。

NioSocketChannel

    protected int doReadBytes(ByteBuf byteBuf) throws Exception {
        return byteBuf.writeBytes(javaChannel(), byteBuf.writableBytes());
    }

如上是正常读取数据的方法。

