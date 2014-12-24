---
layout: default
title:  handler
categories:
  - netty

---
# {{ page.title }}

![大概的类图](/blog/image/netty-handler.jpg)

##1. 数据流

事件流有两种，upstream事件和downstream事件。upstream是从socket read数据开始到最终处理到数据。downstream是write数据到socket。

![流](/blog/image/netty-handler3.jpg)

ChannelInboundHandlerAdapter和ChannelOutboundHandlerAdapter2是两个基础类。继承对于接口，简单实现了所有方法。

##2. 顺序

添加代码：
	
    public void initChannel(SocketChannel socketChannel) throws Exception {
		ChannelPipeline p = socketChannel.pipeline();
		p.addLast(new ChannelInboundHandlerAdapter1());
		p.addLast(new ChannelOutboundHandlerAdapter2());
		p.addLast(new ChannelInboundHandlerAdapter3());
		p.addLast(new ChannelOutboundHandlerAdapter4());
    }


执行顺序：

![大概的类图](/blog/image/netty-handler2.jpg)


