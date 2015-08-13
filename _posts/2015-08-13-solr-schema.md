---
layout: default
title:  solr schema.xml
categories:
  - solr

---
# {{ page.title }}

schema.xml文件用户存储表的结构：

1. 示例

    <?xml version="1.0" ?>
    <!--
     Licensed to the Apache Software Foundation (ASF) under one or more
     contributor license agreements.  See the NOTICE file distributed with
     this work for additional information regarding copyright ownership.
     The ASF licenses this file to You under the Apache License, Version 2.0
     (the "License"); you may not use this file except in compliance with
     the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
    -->

    <schema name="example core zero" version="1.1">

       <!-- 定义用到的字段类型，可以自定义 -->
        <fieldtype name="string"  class="solr.StrField" sortMissingLast="true" omitNorms="true"/>
        <fieldType name="slong" class="solr.SortableLongField" sortMissingLast="true" omitNorms="true"/>
        <fieldType name="tint" class="solr.TrieIntField" precisionStep="0" positionIncrementGap="0"/>
        <fieldType name="tlong" class="solr.TrieLongField" precisionStep="0" positionIncrementGap="0"/>
        <fieldType name="int" class="solr.IntField"/>
        <fieldtype name="geohash" class="solr.GeoHashField"/>

        <!-- 表的字段已经对应的
        type：类型，和上面对应，
        indexed：是否是索引，将不需要被用于搜索的，而只是作为查询结果返回的field的indexed设置为false
        stored：是否存储，将所有只用于搜索的，而不需要作为查询结果的field（特别是一些比较大的field）的stored设置为false
        multiValued：是否有多个值（对可能存在多值的字段尽量设置为true，避免建索引时抛出错误）
        required： 是否必填项-->
        <field name="user_id"     type="slong"   indexed="true"  stored="true"  multiValued="false" required="true"/>
        <field name="location"    type="geohash"   indexed="true"  stored="true"  multiValued="false" />
        <field name="gender"      type="tint"   indexed="true"  stored="true"  multiValued="false" />
        <field name="create_time" type="slong"     indexed="true"  stored="true"/>
        <field name="_version_"   type="tlong"     indexed="true"  stored="true"/>

        <!-- field to use to determine and enforce document uniqueness. -->
        <uniqueKey>user_id</uniqueKey>

        <!-- field for the QueryParser to use when an explicit fieldname is absent -->
        <defaultSearchField>location</defaultSearchField>

        <!-- SolrQueryParser configuration: defaultOperator="AND|OR" -->
        <solrQueryParser defaultOperator="OR"/>
    </schema>

上面是文件的例子，根据location来搜索附近的人，location是geohash类型，geohash是solr.GeoHashField.class定义的类。

##2. 优化

为了改进性能，可以采取以下几种措施：
1.   将所有只用于搜索的，而不需要作为查询结果的field（特别是一些比较大的field）的stored设置为false。
 
2.   将不需要被用于搜索的，而只是作为查询结果返回的field的indexed设置为false。
 
3.   删除所有不必要的copyField声明，根据需要决定是否进行存储。
 
4.   为了索引字段的最小化和搜索的效率，将所有的 text fields的index都设置成false，然后使用copyField将他们都复制到一个总的 text field上，然后对他进行搜索。
 
5.   使用尽可能高的Log输出等级，减少日志量。可以在solr/admin 中的 LOGGING 进行设置。 


