---
title: "PyQt + FastAPI 搭建建筑缺陷检测桌面系统"
published: 2026-07-01
updated: 2026-07-01
draft: false
description: "记录建筑缺陷检测系统的工程结构：PyQt 客户端负责交互和项目管理，FastAPI 服务负责模型推理和结果回传。"
image: "/blog-assets/system-architecture.svg"
tags: ["PyQt", "FastAPI", "系统架构"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么拆成客户端和服务端

建筑缺陷检测不是单次脚本推理，而是包含项目打开、图片管理、模型检测、结果复核、三维联动和报告导出的一套流程。

把 PyQt 客户端和 FastAPI 检测服务拆开后，界面交互和模型推理可以独立维护，也方便模型替换或接口扩展。

## 系统里的关键模块

客户端承担的是工程化工作：让用户知道数据在哪里、检测进度如何、检测结果怎么查看和修正。

这类桌面系统的关键是把“模型输出”变成“用户可操作的结果”。检测框要能保存、能复查、能修正、能统计，还要能进入三维和报告模块。

- 图片添加、删除、预览、缩放和多视图切换
- 检测进度反馈、结果统计和类别颜色展示
- 从后端获取标签文件，在本地完成更多可视化和复核操作
- 三维模型加载、项目数据库和报告资产目录管理

### 前后端检测链路伪代码

```text
function detectFromClient(selectedImages):
  disable detect button
  for image in selectedImages:
    update progress bar
    labels = call FastAPI detection endpoint
    save labels to project result folder
    render preview with class colors
    update class statistics
  enable manual correction
  enable report export
```

伪代码展示 UI 流程，重点表达检测请求、标签保存和界面刷新之间的关系。

前端接收标签文件比接收结果图片更灵活：缩放、筛选、修正和统计都可以在本地完成。

![PyQt 和 FastAPI 系统架构图](/blog-assets/system-architecture.svg)

> 系统架构图：PyQt 负责交互和项目上下文，FastAPI 负责检测服务，数据库和报告模块承接结果。

![检测系统界面截图](/blog-assets/detection-ui-result.png)

> 检测系统结果界面：展示检测前后视图、类别统计和结果复核入口。
