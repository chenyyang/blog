---
layout: default
title:  solr solrconfig.xml
categories:
  - solr

---
# {{ page.title }}

## 1. 示例

solrconfig.xml文件里面配置了这个库的信息。

    <?xml version="1.0" encoding="UTF-8" ?>
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

    <!--
     This is a stripped down config file used for a simple example...
     It is *not* a good example to work from.
    -->
    <config>
        <luceneMatchVersion>4.10.4</luceneMatchVersion>
        <!--  The DirectoryFactory to use for indexes.
              solr.StandardDirectoryFactory, the default, is filesystem based.
              solr.RAMDirectoryFactory is memory based, not persistent, and doesn't work with replication. -->
        <directoryFactory name="DirectoryFactory" class="${solr.directoryFactory:solr.StandardDirectoryFactory}"/>

        <!-- data路径，默认是在本路径下的data文件里面-->
        <dataDir>${solr.core0.data.dir:}</dataDir>

        <!-- To enable dynamic schema REST APIs, use the following for <schemaFactory>:

             <schemaFactory class="ManagedIndexSchemaFactory">
               <bool name="mutable">true</bool>
               <str name="managedSchemaResourceName">managed-schema</str>
             </schemaFactory>

             When ManagedIndexSchemaFactory is specified, Solr will load the schema from
             he resource named in 'managedSchemaResourceName', rather than from schema.xml.
             Note that the managed schema resource CANNOT be named schema.xml.  If the managed
             schema does not exist, Solr will create it after reading schema.xml, then rename
             'schema.xml' to 'schema.xml.bak'.

             Do NOT hand edit the managed schema - external modifications will be ignored and
             overwritten as a result of schema modification REST API calls.

             When ManagedIndexSchemaFactory is specified with mutable = true, schema
             modification REST API calls will be allowed; otherwise, error responses will be
             sent back for these requests.
        -->
        <schemaFactory class="ClassicIndexSchemaFactory"/>

        <updateHandler class="solr.DirectUpdateHandler2">
            <updateLog>
                <str name="dir">${solr.core0.data.dir:}</str>
            </updateLog>
        </updateHandler>

        <!-- realtime get handler, guaranteed to return the latest stored fields
          of any document, without the need to commit or open a new searcher. The current
          implementation relies on the updateLog feature being enabled. -->
        <requestHandler name="/get" class="solr.RealTimeGetHandler">
            <lst name="defaults">
                <str name="omitHeader">true</str>
            </lst>
        </requestHandler>

        <requestHandler name="/replication" class="solr.ReplicationHandler" >
            <lst name="master"> <!-- 需要同步到slave的配置 replicateAfter 表示什么时候触发同步，confFiles表示同步的文件-->
                <str name="replicateAfter">commit</str>
                <str name="replicateAfter">startup</str>
                <str name="confFiles">schema.xml,stopwords.txt</str>
            </lst>

            <!-- 从对应从的配置如下  pollInterval表示同步间隔
            <lst name="slave">
                <str name="masterUrl">http://master的ip:8983/solr/user_location</str>
                <str name="pollInterval">00:00:10</str>
            </lst>
            -->
        </requestHandler>

        <requestDispatcher handleSelect="true" >
            <requestParsers enableRemoteStreaming="false" multipartUploadLimitInKB="2048" formdataUploadLimitInKB="2048" />
        </requestDispatcher>

        <requestHandler name="standard" class="solr.StandardRequestHandler" default="true" />
        <requestHandler name="/analysis/field" startup="lazy" class="solr.FieldAnalysisRequestHandler" />
        <requestHandler name="/update" class="solr.UpdateRequestHandler"  />
        <requestHandler name="/admin/" class="org.apache.solr.handler.admin.AdminHandlers" />
        <requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
            <!-- 此处配置从mysql中倒入数据的配置，mysql中需要有对应的表-->
            <lst name="defaults">
                <str name="config">/home/work/solr/example/solr/user_location/conf/data-import.xml</str>
            </lst>
        </requestHandler>

        <requestHandler name="/admin/ping" class="solr.PingRequestHandler">
            <lst name="invariants">
                <str name="q">solrpingquery</str>
            </lst>
            <lst name="defaults">
                <str name="echoParams">all</str>
            </lst>
        </requestHandler>

        <!-- config for the admin interface -->
        <admin>
            <defaultQuery>solr</defaultQuery>
        </admin>

        <!-- cache的设置-->
        <query>
            <maxBooleanClauses>1024</maxBooleanClauses>
            <filterCache class="solr.FastLRUCache"
                         size="2048"
                         initialSize="1024"
                         autowarmCount="2048"/>
            <queryResultCache class="solr.FastLRUCache"
                              size="10240"
                              initialSize="2048"
                              autowarmCount="4096"/>
            <documentCache class="solr.LRUCache"
                           size="2048"
                           initialSize="1024"
                           autowarmCount="0"/>
            <cache name="perSegFilter"
                   class="solr.search.LRUCache"
                   size="10"
                   initialSize="0"
                   autowarmCount="10"
                   regenerator="solr.NoOpRegenerator" />
            <enableLazyFieldLoading>true</enableLazyFieldLoading>
            <queryResultWindowSize>50</queryResultWindowSize>
            <queryResultMaxDocsCached>200</queryResultMaxDocsCached>
            <listener event="newSearcher" class="solr.QuerySenderListener">
                <arr name="queries">
                    <lst><str name="q">*:*</str><str name="sort">modify_time desc</str></lst>
                </arr>
            </listener>
            <listener event="firstSearcher" class="solr.QuerySenderListener">
                <arr name="queries">
                    <lst>
                        <str name="q">*:*</str><str name="sort">modify_time desc</str>
                    </lst>
                </arr>
            </listener>
            <useColdSearcher>false</useColdSearcher>
            <maxWarmingSearchers>2</maxWarmingSearchers>

        </query>

    </config>


上面是一个主、从配置的例子。
