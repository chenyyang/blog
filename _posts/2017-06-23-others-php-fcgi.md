---
layout: default
title:  FastCGI和PHP-FPM关系
categories:
  - others

---
# {{ page.title }}

## 1. FastCgi与PHP-fpm关系

<img src="/blog/image/fcgi2.png" style="max-width:100%;"/> 

当Web Server收到 index.php 这个请求后，会启动对应的 CGI 程序，这里就是PHP的解析器。接下来PHP解析器会解析php.ini文件，初始化执行环境，然后处理请求，再以规定CGI规定的格式返回处理后的结果，退出进程，Web server再把结果返回给浏览器。这就是一个完整的动态PHP Web访问流程，接下来再引出这些概念，就好理解多了，

  - CGI：是 Web Server 与 Web Application 之间数据交换的一种协议。
  - FastCGI：同 CGI，是一种通信协议，但比 CGI 在效率上做了一些优化。同样，SCGI 协议与 FastCGI 类似。
  - PHP-CGI：是 PHP （Web Application）对 Web Server 提供的 CGI协议的接口程序。
  - PHP-FPM：是 PHP（Web Application）对 Web Server 提供的 FastCGI 协议的接口程序，额外还提供了相对智能一些任务管理。

WEB 中
  - Web Server 一般指Apache、Nginx、IIS、Lighttpd、Tomcat等服务器，
  - Web Application 一般指PHP、Java、Asp.net等应用程序。
  
流程: 

<img src="/blog/image/fcgi3.png" style="max-width:100%;"/> 

1. Web Server启动时载入FastCGI进程管理器（Apache Module或IIS ISAPI等)
2. FastCGI进程管理器自身初始化，启动多个CGI解释器进程(可建多个php-cgi)，并等待来自Web Server的连接。
3. 当客户端请求到达Web Server时，FastCGI进程管理器选择并连接到一个CGI解释器。Web server将CGI环境变量和标准输入发送到FastCGI子进程php-cgi。
5. FastCGI子进程完成处理后，将标准输出和错误信息从同一连接返回Web Server。当FastCGI子进程关闭连接时，请求便告处理完成。
6. FastCGI子进程接着等待，并处理来自FastCGI进程管理器(运行在Web Server中)的下一个连接。 在CGI模式中，php-cgi在此便退出了。

FastCGI与CGI特点：
1. 对于CGI来说，每一个Web请求PHP都必须重新解析php.ini、重新载入全部扩展，并重初始化全部数据结构。而使用FastCGI，所有这些都只在进程启动时发生一次。一个额外的好处是，持续数据库连接(Persistent database connection)可以工作。
2. 由于FastCGI是多进程，所以比CGI多线程消耗更多的服务器内存，php-cgi解释器每进程消耗7至25兆内存，将这个数字乘以50或100就是很大的内存数。

演变过程：

<img src="/blog/image/fcgi4.png" style="max-width:100%;"/> 

## 2. CGI
CGI是为了保证web server传递过来的数据是标准格式的，方便CGI程序的编写者。

* web server（比如说nginx）只是内容的分发者。比如，如果请求/index.html，那么web server会去文件系统中找到这个文件，发送给浏览器，这里分发的是静态数据。好了，如果现在请求的是/index.php，根据配置文件，nginx知道这个不是静态文件，需要去找PHP解析器来处理，那么他会把这个请求简单处理后交给PHP解析器。Nginx会传哪些数据给PHP解析器呢？url要有吧，查询字符串也得有吧，POST数据也要有，HTTP的header不能少吧，好的，CGI就是规定要传哪些数据、以什么样的格式传递给后方处理这个请求的协议。仔细想想，你在PHP代码中使用的用户从哪里来的。
当web server收到/index.php这个请求后，会启动对应的CGI程序，这里就是PHP的解析器。接下来PHP解析器会解析php.ini文件，初始化执行环境，然后处理请求，再以规定CGI规定的格式返回处理后的结果，退出进程。web server再把结果返回给浏览器。

## 3. Fastcgi
Fastcgi是用来提高CGI程序性能的。

* 提高性能，那么CGI程序的性能问题在哪呢？"PHP解析器会解析php.ini文件，初始化执行环境"，就是这里了。标准的CGI对每个请求都会执行这些步骤（不闲累啊！启动进程很累的说！），所以处理每个时间的时间会比较长。这明显不合理嘛！那么Fastcgi是怎么做的呢？首先，Fastcgi会先启一个master，解析配置文件，初始化执行环境，然后再启动多个worker。当请求过来时，master会传递给一个worker，然后立即可以接受下一个请求。这样就避免了重复的劳动，效率自然是高。而且当worker不够用时，master可以根据配置预先启动几个worker等着；当然空闲worker太多时，也会停掉一些，这样就提高了性能，也节约了资源。这就是fastcgi的对进程的管理。

## 4. PHP-FPM

是一个实现了Fastcgi的程序，被PHP官方收了。

* 大家都知道，PHP的解释器是php-cgi。php-cgi只是个CGI程序，他自己本身只能解析请求，返回结果，不会进程管理（皇上，臣妾真的做不到啊！）所以就出现了一些能够调度php-cgi进程的程序，比如说由lighthttpd分离出来的spawn-fcgi。好了PHP-FPM也是这么个东东，在长时间的发展后，逐渐得到了大家的认可（要知道，前几年大家可是抱怨PHP-FPM稳定性太差的），也越来越流行。

## 5. php-fpm和fastcgi

php-fpm是fastcgi进程的管理器，用来管理fastcgi进程的
* php-fpm的管理对象是php-cgi。但不能说php-fpm是fastcgi进程的管理器，因为前面说了fastcgi是个协议，似乎没有这么个进程存在，就算存在php-fpm也管理不了他（至少目前是）。有的说，php-fpm是php内核的一个补丁以前是对的。因为最开始的时候php-fpm没有包含在PHP内核里面，要使用这个功能，需要找到与源码版本相同的php-fpm对内核打补丁，然后再编译。后来PHP内核集成了PHP-FPM之后就方便多了，使用--enalbe-fpm这个编译参数即可。

还有的说PHP-CGI是PHP自带的FastCGI管理器，那这样的话干吗又弄个php-fpm出
* php-cgi与php-fpm一样，也是一个fastcgi进程管理器，php-cgi的问题在于
* 1、php-cgi变更php.ini配置后需重启php-cgi才能让新的php-ini生效，不可以平滑重启
* 2、直接杀死php-cgi进程,php就不能运行了。(PHP-FPM和Spawn-FCGI就没有这个问题,守护进程会平滑从新生成新的子进程。） 针对php-cgi的不足，php-fpm应运而生。

## 6. 总结:
  - fastcgi是一个协议，php-fpm实现了这个协议
  - php-fpm是fastcgi进程的管理器，用来管理fastcgi进程的



