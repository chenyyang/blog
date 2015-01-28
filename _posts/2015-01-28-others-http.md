---
layout: default
title:  http代理协议
categories:
  - others

---
# {{ page.title }}

http代理协议是http协议里的connect方法。

##1. 客户端发起connect

报文：

    CONNECT www.web-tinker.com:80 HTTP/1.1
    Host: www.web-tinker.com:80
    Proxy-Connection: Keep-Alive
    Proxy-Authorization: Basic *
    Content-Length: 0

除了CONNECT和Proxy-Connection，其他协议头和post get协议相似。

##2. 服务器响应

正常链接成功报文：

    HTTP/1.1 200 Connection Established

如果用户名和密码验证不通过报文：

    HTTP/1.1 407 Unauthorized

##3. 发送数据

接下来就可以正常发post get请求。

