---
layout: default
title:  socks5协议
categories:
  - others

---
# {{ page.title }}

##1. socks5 socks4 http代理协议

优点：<br>
socks5是基于tcp的代理协议，socks4是早版本，不能支持UDP协议。HTTP代理基于应用层的代理协议，比socks5慢一些。

缺点：<br>
socks在传输层，基于tcp协议，一般是1080端口。HTTP代理是基于http协议，一般是80、8080端口。所以socks可能被防火墙拦截。而http不会。

##2. socks5协议

###2.1. 客户端发起请求链接

报文：

    +—-+———-+———-+
    |VER | NMETHODS | METHODS |
    +—-+———-+———-+
    | 1　| 　　1　　| 1 to 255 |
    +—-+———-+———-+

解释：

VER：版本号，socks5则05，socks4则04<br>
NMETHODS：METHODS的个数<br>
METHODS：可选择的链接的方法类型，当前被定义的类型：<br>
    
    >> X’00′ 无验证需求
    >> X’01′ 通用安全服务应用程序接口(GSSAPI)
    >> X’02′ 用户名/密码(USERNAME/PASSWORD)
    >> X’03′ 至 X’7F’ IANA 分配(IANA ASSIGNED)
    >> X’80′ 至 X’FE’ 私人方法保留(RESERVED FOR PRIVATE METHODS)
    >> X’FF’ 无可接受方法(NO ACCEPTABLE METHODS)

###2.2. 服务器回复选择链接方法

报文：

    +--—-+-----——–+
    |VER | METHOD |
    +—---+——–+
    | 1　| 　1　　|
    +—---+——–+

解释：

VER：版本号，socks5则05，socks4则04<br>
METHOD：客户端提供的可选择方法中选择的方法<br>

###2.3. 客户端发送目的机器链接详情

报文：

    +—-—-+—–+——-+——+———-+———-+
    |VER | CMD |　RSV　| ATYP | DST.ADDR | DST.PORT |
    +—-—-+—–+——-+——+———-+———-+
    | 1　| 　1 | X’00′ | 　1　| Variable |　　 2　　|
    +—-—-+—–+——-+——+———-+———-+

解释：

VER：版本号，socks5则05，socks4则04<br>
CMD：与目的机器链接类型，当前被定义的类型：<br>

    >> CONNECT X’01′
    >> BIND X’02′
    >> UDP ASSOCIATE X’03′

RSV：RESERVED，基本都是00<br>
ATYP：后面填写的adderss的类型：<br>

    >> IP V4 address: X’01′
    >> DOMAINNAME: X’03′ 域名
    >> IP V6 address: X’04′

DST.ADDR：目的机器ip<br>
DST.PORT：目的机器port<br>

###2.4. 服务器链接目的机器链接并返回本机信息

报文：

    +—-—-+—–+——-+——+———-+———-+
    |VER | REP |　RSV　| ATYP | BND.ADDR | BND.PORT |
    +—-—-+—–+——-+——+———-+———-+
    | 1　|　1　| X’00′ |　1 　| Variable | 　　2　　|
    +—-—-+—–+——-+——+———-+———-+

解释：

VER：版本号，socks5则05，socks4则04<br>
REP：回复信息，列表如下：<br>

    >> X’00′ succeeded
    >> X’01′ general SOCKS server failure
    >> X’02′ connection not allowed by ruleset
    >> X’03′ Network unreachable
    >> X’04′ Host unreachable
    >> X’05′ Connection refused
    >> X’06′ TTL expired
    >> X’07′ Command not supported
    >> X’08′ Address type not supported
    >> X’09′ to X’FF’ unassigned

RSV：RESERVED，基本都是00<br>
ATYP：后面填写的adderss的类型：<br>

    >> IP V4 address: X’01′
    >> DOMAINNAME: X’03′ 域名
    >> IP V6 address: X’04′

DST.ADDR：本机建立链接的ip<br>
DST.PORT：本机建立链接的port<br>

之前是建立链接的过程，接下来就跟普通传输tcp协议一样了，对客户端而言代理是透明的。





cmd类型详解：

CONNECT<br>

在CONNECT的回应中，BND.PORT包括了服务器分配的连接到目标主机的端口号，同时BND.ADDR包含了关联的IP地址。此处所提供的 BND.ADDR通常情况不同于客户机连接到SOCKS服务器所用的IP地址，因为这些服务器提供的经常都是多址的(muti-homed)。都期望 SOCKS主机能使用DST.ADDR和DST.PORT,连接请求评估中的客户端源地址和端口。

BIND<br>

BIND请求被用在那些需要客户机接受到服务器连接的协议中。FTP就是一个众所周知的例子，它通过使用命令和状态报告建立最基本的客户机-服务器连接，按照需要使用服务器-客户端连接来传输数据。(例如：ls,get,put)
都期望在使用应用协议的客户端在使用CONNECT建立首次连接之后仅仅使用BIND请求建立第二次连接。都期望SOCKS主机在评估BIND请求时能够使用DST.ADDR和DST.PORT。
有两次应答都是在BIND操作期间从SOCKS服务器发送到客户端的。第一次是发送在服务器创建和绑定一个新的socket之后。BIND.PORT 域包含了SOCKS主机分配和侦听一个接入连接的端口号。BND.ADDR域包含了关联的IP地址。　　客户端具有代表性的是使用这些信息来通报应用程序连接到指定地址的服务器。第二次应答只是发生在预期的接入连接成功或者失败之后。在第二次应答中，BND.PORT和BND.ADDR域包含了欲连接主机的地址和端口号。

UDP<br>

UDP 连接请求用来建立一个在UDP延迟过程中操作UDP数据报的连接。DST.ADDR和DST.PORT域包含了客户机期望在这个连接上用来发送UDP数据报的地址和端口。服务器可以利用该信息来限制至这个连接的访问。如果客户端在UDP连接时不持有信息，则客户端必须使用一个全零的端口号和地址。

