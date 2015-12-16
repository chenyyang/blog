---
layout: default
title:  GROUP BY完成只取一个
categories:
  - mysql

---
# {{ page.title }}

用group by可以实现每组直取一个；

select class_id,class_name,student_name from classmate_8 where class_name like '%2%' group by class_id ;

如上取班级名字带2的，一个班上的学生的名字。
