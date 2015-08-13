---
layout: default
title:  solr data-import.xml配置
categories:
  - java

---
# {{ page.title }}

data-import.xml文件配置的是mysql导入solr的信息。

Solr提供了full-import和delta-import两种导入方式，这篇文章主要讲解后者。
所谓delta-import主要是对于数据库（也可能是文件等等）中增加或者被修改的字段进行导入。主要原理是利用率每次我们进行import的时候在solr.home\conf下面生成的dataimport.properties文件，此文件里面有最近一次导入的相关信息。
如下：

    #Wed Apr 21 16:48:27 CST 2010
    last_index_time=2010-04-21 16\:48\:24
    id.last_index_time=2010-04-21 16\:48\:24

其实last_index_time是最近一次索引（full-import或者delta-import）的时间。
通过比较这个时间和我们数据库表中的timestamp列即可得出哪些是之后修改或者添加的。

    <?xml version="1.0" encoding="UTF-8"?>
    <dataConfig>
        <dataSource type="JdbcDataSource"
                    driver="com.mysql.jdbc.Driver"
                    url="jdbc:mysql://mysql ip/pengpeng"
                    user="user"
                    password="password"/>
    
        <document name="doc">
            <entity name="user_location"
                    query="SELECT * FROM `user_location`"
                    deltaImportQuery="SELECT user_id,location,gender,modify_time FROM `user_location` WHERE user_id='${dataimporter.delta.job_jobs_id}'"
                    deltaQuery="select user_id from `user_location` where `modify_time` > '${dataimporter.last_index_time}'">
    
                <!-- column：是mysql字段 ， name：是schema中的字段名字-->
                <field column="user_id" name="user_id" />
                <field column="location" name="location" />
                <field column="gender" name="gender" />
                <field column="modify_time" name="modify_time" />
            </entity>
        </document>
    </dataConfig>


部分参数：

entity:
        entity是document下面的标签（data-config.xml）。使用这个参数可以有选择的执行一个或多个entity   。使用多个entity参数可以使得多个entity同时运行。如果不选择此参数那么所有的都会被运行。
clean:
        选择是否要在索引开始构建之前删除之前的索引，默认为true
commit:
        选择是否在索引完成之后提交。默认为true
optimize:
        是否在索引完成之后对索引进行优化。默认为true
debug:
        是否以调试模式运行，适用于交互式开发（interactive development mode）之中。
        请注意，如果以调试模式运行，那么默认不会自动提交，请加参数“commit=true”

