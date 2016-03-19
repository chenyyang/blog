---
layout: default
title:  IDEA打包
categories:
  - linux

---
# {{ page.title }}

##1.步骤1

选中Java项目工程名称，在菜单中选择 File->project structure... (快捷键Ctrl+Alt+Shift+S) 

<img src="/blog/image/idea1.jpg" style="max-width:100%;"/>

##2.步骤2

在弹出的窗口中左侧选中"Artifacts"，点击"+"选择jar，然后选择"from modules with dependencies"。

<img src="/blog/image/idea2.jpg" style="max-width:100%;"/>

##3.步骤3

在配置窗口中配置"Main Class"。

<img src="/blog/image/idea3.jpg" style="max-width:100%;"/>

##4.步骤4

选择“Main Class”后，选择“copy to the output  and link via manifest”，配置“Directory for META-INF/MAINFEST.MF”，此项配置的缺省值是：D:\workshop\DbUtil\src\main\java，需要改成：D:\workshop\DbUtil\src\main\resources，如果不这样修改，打成的jar包里没有包含META-INF/MAINFEST.MF文件，这个应该是个IDEA的BUG（参考：http://stackoverflow.com/questions/15724091/how-to-run-a-jar-file-created-using-intellij-12），配置完成后如下图所示，点击OK进入下一步。（此方法我没有成功，如果选择“extract to the target jar”，即把第三方jar文件，打入最终的可运行jar包时，可以不修改“Directory for META-INF/MAINFEST.MF”的配置，用缺省值即可）

<img src="/blog/image/idea4.jpg" style="max-width:100%;"/>

##5.步骤5

右键“<output root>”，选择“Create Directory”，输入目录名：lib

<img src="/blog/image/idea5.jpg" style="max-width:100%;"/>

##6.步骤6

用鼠标按住第三方jar，拖入<output root>下的lib目录下

<img src="/blog/image/idea6.jpg" style="max-width:100%;"/>

##7.步骤7

用鼠标选中我们将要打出的jar包文件，点击下方“Class Path:”后面的按钮，在“Edit Classpath”窗口中，将每个第三方jar文件前加上相对路径：lib\，形成如：lib\xxx.jar的形式，这个目录“lib”，就是前面输入的那个“lib”,这里如果第三方jar很多的话，可以在“Edit Classpath”窗口中，用鼠标选中所有第三方jar，然后Ctrl+X，把内容cut & copy到UltraEdit里，用列格式一下子全部修改好,再paste到“Edit Classpath”窗口中。完成后如下所示：

<img src="/blog/image/idea7.jpg" style="max-width:100%;"/>

##8.步骤8

完成后，点击OK，Apply等按钮，回到IDEA的主菜单，选择“Build - Build Artifacts”下的“Build”或者“Rebuild”即可生成最终的可运行的jar，并把第三方jar放到和此jar并行的lib目录下，用winrar打开目标jar，可以看到META-INF/MAINFEST.MF文件被正确包含，内容也正确。

<img src="/blog/image/idea8.jpg" style="max-width:100%;"/>

##9.步骤9

在jar包的输出目录下，执行命令：java -jar xxx.jar，即可运行jar文件。

原文：http://bglmmz.iteye.com/blog/2058785
