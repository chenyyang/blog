---
layout: default
title:  solr查询和solrj使用
categories:
  - solr

---
# {{ page.title }}

solr可以通过页面http://ip:8983/solr/#/ 进行操作。也可以用solrj这个java包进行操作。

solrj也是通过调用http来链接solr的server。

##1. 参数

q – 查询字符串，必须的。Solr 中用来搜索的查询。有关该语法的完整描述，请参阅 参考资料 中的 “Lucene QueryParser Syntax”。可以通过追加一个分号和已索引且未进行断词的字段的名称来包含排序信息。默认的排序是 score desc，指按记分降序排序。           q=myField:Java AND otherField:developerWorks; date asc此查询搜索指定的两个字段并根据一个日期字段对结果进行排序。

start – 返回第一条记录在完整找到结果中的偏移位置，0开始，一般分页用。

rows – 指定返回结果最多有多少条记录，配合start来实现分页。

sort – 排序，格式：sort=<field name>+<desc|asc>[,<field name>+<desc|asc>]… 。示例：（inStock desc, price asc）表示先 “inStock” 降序, 再 “price” 升序，默认是相关性降序。

wt – (writer type)指定输出格式，可以有 xml, json, php, phps, 后面 solr 1.3增加的，要用通知我们，因为默认没有打开。

fq – （filter query）过虑查询，作用：在q查询符合结果中同时是fq查询符合的，

fl- field作为逗号分隔的列表指定文档结果中应返回的 Field 集。默认为 “*”，指所有的字段。“score” 指还应返回记分。例如 *,score
将返回所有字段及得分。用solrj的bean时，得在query中指定 query.set("fl", "*,score");

q.op – 覆盖schema.xml的defaultOperator（有空格时用"AND"还是用"OR"操作逻辑），一般默认指定

df – 默认的查询字段，一般默认指定

qt – （query type）指定那个类型来处理查询请求，一般不用指定，默认是standard。

indent – 返回的结果是否缩进，默认关闭，用 indent=true|on 开启，一般调试json,php,phps,ruby输出才有必要用这个参数。

version – 查询语法的版本，建议不使用它，由服务器指定默认值。

##2. solrj

需要引入solr包：

		<dependency>
			<groupId>org.apache.solr</groupId>
			<artifactId>solr-solrj</artifactId>
			<version>4.10.0</version>
		</dependency>

java代码：

    public static void main(String [] arg) throws SolrServerException {
        double latitude=1.0, longitude=2.0; //经纬度
        int distance = 10;  //距离
        int gender =1;  //查询的字段
        int offset = 200;   //偏移量，用来分片
        int count = 20;    //个数
        String slaveUrl = "http://ip:port/solr/user_location";
        HttpSolrServer server = new HttpSolrServer(slaveUrl);
        server.setSoTimeout(500);  // socket read timeout
        server.setConnectionTimeout(500);
        server.setDefaultMaxConnectionsPerHost(100);
        server.setMaxTotalConnections(100);
        server.setFollowRedirects(false);
        server.setAllowCompression(true);
        server.setMaxRetries(2);
        SolrQuery query = new SolrQuery();
        query.addFilterQuery("{!geofilt}");
        query.set("q", "gender:" + gender);
        query.set("d", String.valueOf(distance));
        query.set("sfield", "location");
        query.setSort("modify_time", SolrQuery.ORDER.desc);
        query.set("pt", latitude + "," + longitude);
        query.setStart(offset);
        query.setRows(count);
        QueryResponse rsp = server.query(query, SolrRequest.METHOD.POST);

        SolrDocumentList results = rsp.getResults();
        long numFound = results.getNumFound();
        List<UserLocation> users = new ArrayList<UserLocation>();
        for (int i = 0; i < results.size(); i++) {
            SolrDocument document = results.get(i);
            System.out.println(document);
        }
    }

HttpSolrServer使用了apache的httpclient工具来发送请求。所以可以设置一些httpclient对应的参数。比如链接数。

SolrQuery里面可以设置所有网页上可以设置的参数，最后会拼接到http请求的url里面。 
