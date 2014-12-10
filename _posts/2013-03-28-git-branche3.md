---
layout: default
title: git管理分支 
categories:
  - gitsvn
---
# {{ page.title }}

###1. 创建分支：

git branch -b [分支名] ：  git branch -b test (创建分支并进入分支)

相当于：

git branch test

git checkout test

###2. 切换分支：

git checkout [分支名] ：  git checkout test

###3. 推送本地分支到远程（创建一个远程分支）：

git push [远程仓库名] [分支名] ： git push origin test

###4. 拷贝远程分支到本地：

git checkout -b [本地新建分支名] [远程仓库名]/[远程分支名]：git checkout -b test origin/test

###5. 删除本地分支:

git branch -d [分支名] ：  git branch -d test

###6. 删除远程分支:

git push origin :[分支名] ：git push origin :test

###7. 合并分支:

git merge [分支名]: git merge test  (将test分支合并到当前分支)

当想同步master分支内容的时候可以：
git merge master
git push

###8. 查看分支：

git branch    （包括查看本地的分支）
git branch -a （包括查看远程的分支）

###9. 同步分支修改

git fetch origin （如果没有这个命令，新增加的分支git branch -a 是看不到的）

###10. 删除本地所有未提交的更改

git reset --hard

###11. 重置提交

git reset --hard HEAD~3 （会将最新的3次提交全部重置，就像没有提交过一样。）

###12. 回退到某个版本

git reset --hard 版本号（git log查看版本号，例如：e4bee1e34ba96ef4abee442f64e5...）
