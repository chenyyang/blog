---
layout: default
title:  git submodule
categories:
  - gitsvn

---
# {{ page.title }}


## 1. 添加

为当前工程添加submodule，命令如下：
    
    git submodule add 仓库地址 路径

## 2. 删除

1. 编辑.gitmodules,删除对应要删除的submodule的行．
2. 编辑.git/config,删除有对应要删除的submodule的行．
3. 删除命令:
    
        git rm --cached ${submodule_PATH}  (PS:此处最后没有符号 / .)

4. 删除对应的目录:
    
        rm -rf ${submodule_PATH}


## 3. 下载后初始化

cd到submodule的目录下

    git submodule update --init --recursive
