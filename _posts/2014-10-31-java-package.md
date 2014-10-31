---
layout: default
title:  java maven打jar包插件
categories:
  - java

---
# {{ page.title }}

##1. maven-jar-plugin

	<plugin>
	    <groupId>org.apache.maven.plugins</groupId>
	    <artifactId>maven-jar-plugin</artifactId>
	    <configuration>
	        <archive>
	            <manifestEntries>
			<addClasspath>true</addClasspath>  
    			<classpathPrefix>lib/</classpathPrefix>
	                <Rose>*</Rose>
	                <Main-Class>com.test.agent.AgentMain</Main-Class>
	            </manifestEntries>
	        </archive>
	    </configuration>
	</plugin>

执行maven clean package 后会通过maven-jar-plugin会生成jar包，manifestEntries中的参数会以key：value的形式存在jar包中META-INF/MANIFEST.MF目录下。但是pom中依赖的其他jar包不会打包进去。

##2. onejar-maven-plugin

	<plugin>
	    <groupId>com.jolira</groupId>
	    <artifactId>onejar-maven-plugin</artifactId>
	    <version>1.4.4</version>
	    <executions>
	        <execution>
	            <configuration>
	                <attachToBuild>true</attachToBuild>
	                <classifier>onejar</classifier>
	            </configuration>
	            <goals>
	                <goal>one-jar</goal>
	            </goals>
	        </execution>
	    </executions>
	</plugin>

执行maven clean package 后除了原本的jar包，额外会生一个xxxxxx.one-jar.jar文件。这个文件直接可以java -jar xxxxxx.one-jar.jar来单独运行。而且就这一个jar。不需要其它依赖。只要有jdk的环境就可直接使用。

##3. appassembler-maven-plugin

	<plugin>
	    <groupId>org.codehaus.mojo</groupId>
	    <artifactId>appassembler-maven-plugin</artifactId>
	    <version>1.1.1</version>
	    <configuration>
	        <extraJvmArguments> -XX:+UseBiasedLocking -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalMode -XX:ParallelCMSThreads=8 -Xms8G -Xmx8G -Xmn2G -Xss256k -XX:PermSize=64m -XX:MaxPermSize=128m -XX:MaxDirectMemorySize=1280m </extraJvmArguments>
	        <programs>
	            <program>
	                <mainClass>com.test.agent.AgentMain</mainClass>
	                <name>agent.sh</name>
	            </program>
	        </programs>
	    </configuration>
	</plugin> 

appassembler-maven-plugin不仅可以生成完整的包，并且可以指定jvm的参数。agent.sh是最终生成的脚本的名字，直接sh agent.sh就可以执行。

