---
layout: default
title:  disruptor介绍二：压测  
categories:
  - Java

---

# {{ page.title }}


##1. 压测

 Disruptor的YidldingWaitStrategy模式消耗cpu特别严重。


<table>
<tr><td>生产消费者条件\压测目标</td><td>BlockingWaitStrategy</td><td>SleepingWaitStrategy</td><td>ThreadPoolExecutor</td>
</tr>
<tr>
<td>P1-C1</td><td>2100万</td><td>2100万（141cpu，0.98load）</td><td>350万</td>
</tr>
<tr>
<td>P1-C2</td><td>1600万</td><td>2100万（270+cpu,2.7 load）</td><td>500万</td>
</tr>
<tr>
<td>P1-C4</td><td>1000万</td><td>1200万（440+cpu,3.3 load）</td><td>660万</td>
</tr>
<tr>
<td>P1-C8</td><td>350万</td><td>900万（620+cpu,3.4 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C16</td><td>2100万</td><td>780万（700+cpu,3.4 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C32</td><td>120万</td><td>440万（740+cpu,4 load）</td><td>700万</td>
</tr>
<tr>
<td>P1-C64</td><td>60万</td><td>290万（740+cpu,6 load）</td><td>720万</td>
</tr>
<tr>
<td>P1-C128</td><td>20万</td><td>136万（784+cpu,15 load）</td><td>680万</td>
</tr>
<tr>
<td>P1-C256</td><td>9万</td><td>54万 (600+cpu,200 load) </td><td>700万</td>
</tr>
</table>


