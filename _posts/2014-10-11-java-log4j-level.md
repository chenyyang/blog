---
layout: default
title:  log4j level 级别修改
categories:
  - java

---
# {{ page.title }}

##1. 代码

	
	<%@ page import="java.util.*,java.text.SimpleDateFormat,org.apache.log4j.LogManager,org.apache.log4j.Logger,org.apache.log4j.Level,java.security.MessageDigest,java.math.BigInteger" pageEncoding="UTF-8"%>
	<%
	
	String path = request.getContextPath();
	String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
	String remoteAddr = request.getRemoteAddr();
	
	%>
	
	<%
	boolean displayLoggerList = true;
	String namesOption = "";
	String outputMessage = "";
	String thisLevel = "NONE";
	String search="";
	
	if ("POST".equals(request.getMethod())){
		displayLoggerList = false;
		String[] names = request.getParameterValues("loggerName");
		thisLevel = request.getParameter("loggerLevel");
		if ( (names != null) && (thisLevel != null) ){
			for (int i=0; i<names.length; i++){
				Logger logger = Logger.getLogger(names[i]);
				Level lev = Level.toLevel(thisLevel);
				logger.setLevel(lev);
				outputMessage += names[i] + "<BR>";
			}
		}
	}else{
		//Generate a list of all the loggers and levels
		ArrayList al = new ArrayList();
		HashMap hm = new HashMap();
		String keyWord = request.getParameter("keyWord");
		//GetRootLogger
		Logger rootLogger = LogManager.getRootLogger();
		String rootLoggerName = rootLogger.getName();
		al.add(rootLoggerName);
		hm.put(rootLoggerName, rootLogger);
		 
		//All Other Loggers
		Enumeration e = LogManager.getCurrentLoggers();
		while (e.hasMoreElements()){
			Logger t1Logger = (Logger) e.nextElement();
			String loggerName = t1Logger.getName();
			al.add(loggerName);
			hm.put(loggerName, t1Logger);
		}
		 
		String[] alLoggerStr = ((String[]) al.toArray(new String[0]));
		Arrays.sort(alLoggerStr);
		int count=0;
		for (int i=0; i<alLoggerStr.length; i++){
			Logger t2Logger = (Logger) hm.get(alLoggerStr[i]);
			String t2LoggerName = t2Logger.getName();
			String t2LoggerLevel = t2Logger.getEffectiveLevel().toString();
			String thisParent = "";
			if (t2Logger.getParent() != null){
				thisParent = t2Logger.getParent().getName();
			}
			if(keyWord==null || t2LoggerName.contains(keyWord)){
				count+=1;
				namesOption += "<OPTION VALUE='" + t2LoggerName + "'>"+t2LoggerName+ " [" + t2LoggerLevel + "] -> " + thisParent + "</OPTION>";
			}
		}
		 
		namesOption = "<SELECT NAME='loggerName' MULTIPLE SIZE='"+(count>25?25:count)+"'>"+namesOption+"</SELECT>";
		search="<input class='txt' type='text' name='keyWord' value='"+(keyWord==null?"":keyWord)+"'/>";
		
	}
	%>
	
	<%
	if (displayLoggerList)
	{
	%>
	<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
	<html>
	  <head>
	    <base href="<%=basePath%>">
	    
	    <title>Logger Setup</title>
	    
	    <meta http-equiv="pragma" content="no-cache">
	    <meta http-equiv="cache-control" content="no-cache">
	    <meta http-equiv="expires" content="0">
	    
	  </head>
	  
	  <body>
	    Please choose the logger and the level:
	    <FORM METHOD="Post">
	    <TABLE CELLPADDING="5" CELLSPACING="0" BORDER="1">
	    <TR>
	    <TD COLSPAN="2"><H2>Enable Disable Logger</H2></TD>
	    </TR>
	    <TR>
	    <TD>Choose Logger:<BR>Format: LoggerClass [Current Level] -> Parent Logger<BR><%=namesOption%></TD>
	    <TD>Choose Level:<BR>
	    <SELECT NAME='loggerLevel'>
	    <OPTION VALUE="ALL">All</OPTION>
	    <OPTION VALUE="DEBUG">Debug</OPTION>
	    <OPTION VALUE="INFO">Info</OPTION>
	    <OPTION VALUE="WARN">Warn</OPTION>
	    <OPTION VALUE="ERROR">Error</OPTION>
	    </SELECT>
	    </TD>
	    </TR>
	    <TR>
	    <TD COLSPAN="2"><INPUT TYPE="Submit" NAME='Submit' VALUE='Apply Changes'><BR>
	    (If you wish to disable all logging then find "root" in the list below and apply a level)
	    </TD>
	    </TR>
	    </TABLE>
	    </FORM>
	    <FORM METHOD="Get">
	    <TR>
	     <TD>关键词 : </TD>
	     <td><%=search%></td>
	     </TR>
	     <TR>
	    <TD COLSPAN="2"><INPUT TYPE="Submit" NAME='Submit' VALUE='Search'><BR>
	    </TD>
	    </FORM>
	  </body>
	</html>
	<%
	}
	else
	{
	%>
	<html>
	  <head>
	    <base href="<%=basePath%>">
	    
	    <title>Logger Setup - Results</title>
	    
	    <meta http-equiv="pragma" content="no-cache">
	    <meta http-equiv="cache-control" content="no-cache">
	    <meta http-equiv="expires" content="0">
	
	  </head>
	  
	  <body>
	    Please choose the logger and the level:
	    <FORM METHOD="Post">
	    <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
	    <TR>
	    <TD COLSPAN="2"><H2>Enable Disable Logger</H2></TD>
	    </TR>
	    <TR>
	    <TD>
	    The following Logger's were set to <%=thisLevel%> level:<BR>
	    <%=outputMessage%>
	    </TD>    
	    </TR>
	    <TR>
	    <TD><A HREF="<%=basePath%>/test.jsp">Return to list</A></TD>
	    </TR>
	    </TABLE>
	    </FORM>
	  </body>
	</html>
	
	<%
	}
	%>


jsp脚本放到项目中即可访问。	
