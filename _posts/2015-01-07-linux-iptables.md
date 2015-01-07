---
layout: default
title:  ubuntu iptables
categories:
  - linux

---
# {{ page.title }}

##1. 基本语法

	[OptiPlex-990 ~]$ sudo iptables -help
	iptables v1.4.12
	
	Usage: iptables -[ACD] chain rule-specification [options]
	       iptables -I chain [rulenum] rule-specification [options]
	       iptables -R chain rulenum rule-specification [options]
	       iptables -D chain rulenum [options]
	       iptables -[LS] [chain [rulenum]] [options]
	       iptables -[FZ] [chain] [options]
	       iptables -[NX] chain
	       iptables -E old-chain-name new-chain-name
	       iptables -P chain target [options]
	       iptables -h (print this help information)
	
	Commands:
	Either long or short options are allowed.
	  --append  -A chain		Append to chain
	  --check   -C chain		Check for the existence of a rule
	  --delete  -D chain		Delete matching rule from chain
	  --delete  -D chain rulenum
					Delete rule rulenum (1 = first) from chain
	  --insert  -I chain [rulenum]
					Insert in chain as rulenum (default 1=first)
	  --replace -R chain rulenum
					Replace rule rulenum (1 = first) in chain
	  --list    -L [chain [rulenum]]
					List the rules in a chain or all chains
	  --list-rules -S [chain [rulenum]]
					Print the rules in a chain or all chains
	  --flush   -F [chain]		Delete all rules in  chain or all chains
	  --zero    -Z [chain [rulenum]]
					Zero counters in chain or all chains
	  --new     -N chain		Create a new user-defined chain
	  --delete-chain
	            -X [chain]		Delete a user-defined chain
	  --policy  -P chain target
					Change policy on chain to target
	  --rename-chain
	            -E old-chain new-chain
					Change chain name, (moving any references)
	Options:
	    --ipv4	-4		Nothing (line is ignored by ip6tables-restore)
	    --ipv6	-6		Error (line is ignored by iptables-restore)
	[!] --proto	-p proto	protocol: by number or name, eg. `tcp'
	[!] --source	-s address[/mask][...]
					source specification
	[!] --destination -d address[/mask][...]
					destination specification
	[!] --in-interface -i input name[+]
					network interface name ([+] for wildcard)
	 --jump	-j target
					target for rule (may load target extension)
	  --goto      -g chain
	                              jump to chain with no return
	  --match	-m match
					extended match (may load extension)
	  --numeric	-n		numeric output of addresses and ports
	[!] --out-interface -o output name[+]
					network interface name ([+] for wildcard)
	  --table	-t table	table to manipulate (default: `filter')
	  --verbose	-v		verbose mode
	  --line-numbers		print line numbers when listing
	  --exact	-x		expand numbers (display exact values)
	[!] --fragment	-f		match second or further fragments only
	  --modprobe=<command>		try to insert modules using this command
	  --set-counters PKTS BYTES	set the counter during insert/append
	[!] --version	-V		print package version.
	

常用命令：
-A  添加在最后一行<br>
-I [行号] 表示在某行添加规则，后面的规则依次向后挪一位<br>
-D  删除某条记录<br>
-D [行号] 表示删除某行的记录<br>
-R [行号]  替换此行的规则<br>
-L 展示所有规则
-p +proto表示协议
-s +address表示地址
-j [DROP|ACCEPT] 表示拒绝还是接受

##2. 实例

	[OptiPlex-990 ~]$ sudo iptables -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination    	

现在什么都没有设置，可见分为三种：INPUT，FORWARD，OUTPUT，执行-A -D都需要带上这三中的一种。

	[OptiPlex-990 ~]$ sudo iptables -A INPUT -s 10.237.15.8 -j DROP
	[OptiPlex-990 ~]$ sudo iptables -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination         
	DROP       all  --  10.237.15.8      anywhere            
	
	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination  

添加一行规则，-A INPUT是添加到INPUT一列，-s带上地址，-j带上操作DROP。

	[OptiPlex-990 ~]$ sudo iptables -I INPUT 1 -p all -j ACCEPT
	[OptiPlex-990 ~]$ sudo iptables -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination         
	ACCEPT     all  --  anywhere             anywhere            
	DROP       all  --  10.237.15.8  anywhere            
	
	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination   

在第一行插入规则，-p带上规则[tcp|udp|all...]，ACCEPT表示接受

	[OptiPlex-990 ~]$ sudo iptables -D INPUT -p all -j ACCEPT
	[OptiPlex-990 ~]$ sudo iptables -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination         
	DROP       all  --  10.237.15.8  anywhere            
	
	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination  

按规则删除一行

	[OptiPlex-990 ~]$ sudo iptables -D INPUT 1
	[OptiPlex-990 ~]$ sudo iptables -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination         
	
	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination 

删除第一行的规则


