---
layout: default
title:  java 过滤https证书验证
categories:
  - java

---
# {{ page.title }}

##1. 依赖的包

	<dependency>
        	<groupId>org.apache.httpcomponents</groupId>
        	<artifactId>httpclient</artifactId>
        	<version>4.3.3</version>
	</dependency>

低版本缺少部分类。

##2. 代码

	public static void main(String[] arg)
            throws ClientProtocolException, IOException, KeyManagementException, NoSuchAlgorithmException, KeyStoreException {
        CloseableHttpClient httpclient = HttpClients.createDefault();
        String url = "";
        String body = "";

        SSLContext sslContext = new SSLContextBuilder().loadTrustMaterial(null, new TrustStrategy() {
            // 信任所有
            public boolean isTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                return true;
            }

        }).build();
        SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(sslContext, null, null, new AllowAllHostnameVerifier());
        httpclient = HttpClients.custom().setSSLSocketFactory(sslsf).build();

        HttpPost httpPost = new HttpPost(url);
        httpPost.setConfig(RequestConfig.custom().setSocketTimeout(1000).setConnectTimeout(1000).build());
        httpPost.setEntity(new StringEntity(body, "UTF-8"));
        HttpContext localContext = new BasicHttpContext();
        CloseableHttpResponse response = httpclient.execute(httpPost, localContext);

        int statusCode = response.getStatusLine().getStatusCode();
        if (statusCode == 301 || statusCode == 302 || statusCode == 303) {
            // 重定向，发起get请求
        }
        HttpEntity entity = response.getEntity();
        String ss = EntityUtils.toString(entity);

        System.out.println("result :  " + ss);
    }

