---
layout: default
title:  网络文件下载和音频时长计算
categories:
  - java

---
# {{ page.title }}

网络文件下载

##1.网络文件下载代码

        FileOutputStream fos = null;
        File myFile = null;
        try {
            String fileName = "testFile";
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            //设置超时间为3秒
            conn.setConnectTimeout(3 * 1000);
            //防止屏蔽程序抓取而返回403错误
            conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
            //得到输入流
            InputStream inputStream = conn.getInputStream();

            //文件保存位置
            myFile = new File(fileName);
            logger.info(" download file path {} , name : {} ", myFile.getAbsolutePath(), myFile.getName());
            //判断文件是否存在
            if (myFile.exists()) {
                myFile.delete();
            }
            myFile.createNewFile();
            fos = new FileOutputStream(myFile);

            byte[] buffer = new byte[1024];
            int len = 0;
            int size = 0;
            while ((len = inputStream.read(buffer)) != -1) {
                fos.write(buffer, 0, len);
                fos.flush();
                size += len;
            }

            logger.info(" download file size {} ,path {} , name : {} ", size, myFile.getAbsolutePath(), myFile.getName());

        } catch (IOException e) {
            logger.error(" download error  url : {} ", urlStr, e);
            throw e;
        } finally {
            try {
                fos.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            //            myFile.delete();
        } 

读取网络中的文件，保存到本地，视频音频都可以

##2. ffmpeg安装

ffmpeg是一套可以用来记录、转换数字音频、视频，并能将其转化为流的开源计算机程序。

mac:

     sudo brew install ffmpeg

linux:linux的源里的ffmpeg很老，建议直接下载文件安装。

    wget http://ffmpeg.org/releases/ffmpeg-2.6.3.tar.bz2
    tar xvf ffmpeg-2.6.3.tar.bz2
    cd ffmpeg-2.6.3
    ./configure --disable-yasm
    make
    make install

上面安装以后就可以使用简单的ffmpeg功能

##3. java代码调用命令行

    /**
     * 获取音乐时长
     *
     * @param filePath
     * @return
     */
    public static int getDuration(String filePath) {
        int duration = 0;
        try {
            String cmd = "/usr/local/bin/ffmpeg -i " + filePath;
            String mmpeg = exec(cmd);
            System.out.println(" mmpeg "+mmpeg);
            mmpeg = mmpeg.substring(mmpeg.indexOf("Duration"), mmpeg.length());
            mmpeg = mmpeg.substring(0, mmpeg.indexOf("."));
            mmpeg = mmpeg.substring(mmpeg.indexOf(":") + 1, mmpeg.length());
            mmpeg = mmpeg.trim();
            String[] fields = mmpeg.split(":");
            duration = Integer.parseInt(fields[1]) * 60 + Integer.parseInt(fields[2]);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return duration;
    }

cmd代码：


	public static String exec(String cmd) throws Exception {
		Process proc = null;
		InputStream in = null;
		try {
			if (logger.isDebugEnabled()) {
				logger.debug("cmd|" + cmd);
			}
			System.out.println("cmd..." + cmd);
			// 使用这种方式可以执行管道命令
			String[] cmds = new String[] { "/bin/sh", "-c", cmd };
			// proc = runtime.exec(new String[] { "/bin/sh", "-c", cmd });
			ProcessBuilder builder = new ProcessBuilder(cmds);
			builder.redirectErrorStream(true);
			proc = builder.start();
			String stdout = "";
			try {
				proc.waitFor();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			BufferedReader br = new BufferedReader(new InputStreamReader(proc.getInputStream()));
			String readLine = br.readLine();
			while (readLine != null) {
				readLine = br.readLine();
				stdout += readLine+"\n";
			}
			System.out.println(" stdout... " + stdout);

			return stdout;
		}  finally {
			if (proc != null) {
				proc.destroy();
			}
			if (in != null) {
				try {
					in.close();
				} catch (IOException e) {

					e.printStackTrace();
				}
			}
		}
	}


如上代码放一起就行了
