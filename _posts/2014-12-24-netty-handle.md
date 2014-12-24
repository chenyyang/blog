---
layout: default
title:  handler
categories:
  - netty

---
# {{ page.title }}


##1. 数据流和类

事件流有两种，upstream事件和downstream事件。upstream是从socket read数据开始到最终处理到数据。downstream是write数据到socket。

upstream对应与ChannelInboundHandler和decoder，downstream对应ChannelOutboundHandler和encoder类。

![大概的类图](/blog/image/netty-handler.jpg)

ChannelInboundHandlerAdapter和ChannelOutboundHandlerAdapter是两个基础类。继承对于接口，简单实现了所有方法。<br>
decoder：继承于ChannelInboundHandlerAdapter类，主要功能是数据的转化decoder，将二进制流转化为对于的对象（基础类型或者自定义类型）。<br>
encoder：继承于ChannelOutboundHandlerAdapter类，主要功能是数据的转化decoder，将write的对象转化为二进制流。
coder：decoder和encoder的功能交集。继承对于的方法即可。

##2. 顺序

添加代码：
	
    public void initChannel(SocketChannel socketChannel) throws Exception {
		ChannelPipeline p = socketChannel.pipeline();
		p.addLast(new ChannelInboundHandlerAdapter1());
		p.addLast(new ChannelOutboundHandlerAdapter2());
		p.addLast(new ChannelInboundHandlerAdapter3());
		p.addLast(new ChannelOutboundHandlerAdapter4());
    }


当数据来了，执行InboundHandler类，按照加入的顺序执行。当需要写数据，执行OutboundHandler类，按照放入的反顺序执行。
执行顺序：

![大概的类图](/blog/image/netty-handler2.jpg)


