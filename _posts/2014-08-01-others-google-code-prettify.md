---
layout: default
title:  google-code-prettify高亮代码
categories:
  - others

---
# {{ page.title }}


##使用方法
1.从https://code.google.com/p/google-code-prettify/downloads/list中下载中打包下载pretty.css以及pretty.js,并保存到本地服务器的相应目录中来引用

2.引用pretty.css以及pretty.js

如下:

	<link rel="stylesheet" href="/blog/resource/prettify-desert.css" />
	<script type="text/javascript" src="/blog/resource/prettify.js" ></script>
    

3.添加脚本，用于识别并高亮代码块，这个需要使用jQuery。

如下：

	<script type="text/javascript">
	$(function() {
	$('pre').addClass('prettyprint linenums').attr('style', 'overflow:auto');
		window.prettyPrint && prettyPrint();
	});
	</script>

其中addClass('prettyprint linenums')的linenums是添加行号的意思。默认只显示第5、10、15…行，可以在css文件中li的格式添加list-style-type: decimal;，以显示全部行号。

4.使用

这样之后，就可以直接用markdown的前置4空格来写代码了，或者使用<pre></pre>标签进行高亮了。
