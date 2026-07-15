---
title: "PyQt + FastAPI 搭建建筑缺陷检测桌面系统"
published: 2026-07-01
updated: 2026-07-14
draft: false
description: "记录建筑缺陷检测系统的工程结构：PyQt 客户端负责交互和项目管理，FastAPI 服务负责模型推理和结果回传。"
image: "/blog-assets/system-architecture.svg"
tags: ["PyQt", "FastAPI", "系统架构"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么不用一个检测脚本解决

建筑外立面缺陷检测如果只做 demo，一个 Python 脚本读取图片、调用模型、保存结果图就够了。但实习项目里的目标不是 demo，而是一个可以支撑巡检流程的系统原型。

系统需要处理的不只是“检测一张图”，还包括：

- 项目目录管理。
- 原始照片和检测结果管理。
- 检测进度和异常提示。
- 检测框可视化和类别统计。
- 人工复核和结果回写。
- OSGB 三维模型加载和联动。
- Word 报告导出。

所以我采用了 PyQt + FastAPI 的结构：PyQt 做桌面端交互，FastAPI 做模型推理服务。

![PyQt 和 FastAPI 系统架构图](/blog-assets/system-architecture.svg)

> 系统架构图：PyQt 负责交互和项目上下文，FastAPI 负责检测服务，数据库和报告模块承接结果。

## 架构拆分

### PyQt 客户端负责什么

客户端主要面向用户操作，重点是让检测结果可以被管理和复查。

核心模块包括：

- 项目管理：创建项目、打开项目、维护项目资产目录。
- 图片列表：导入图片、删除图片、切换图片、查看原图。
- 检测结果：显示检测框、类别颜色、置信度和统计信息。
- 三维模型：嵌入 OSGViewer，加载 OSGB 实景三维模型。
- 人工复核：调用 LabelMe 修改检测标签。
- 报告导出：生成 Word 报告和相关图片资产。

### FastAPI 服务负责什么

FastAPI 服务只做推理相关工作：

- 接收检测请求。
- 调用 SAHI 切片推理。
- 调用 Ultralytics 模型。
- 返回结构化检测标签。
- 记录推理耗时和异常。

我没有让后端直接返回一张画好框的图片，而是返回结构化数据。因为结构化标签后续还能继续用于统计、复核、三维定位和报告生成。

## 检测链路

一次检测任务大致如下：

```text
用户在 PyQt 选择图片
  -> 客户端发起检测请求
  -> FastAPI 接收图片路径或图片文件
  -> SAHI 切片推理
  -> YOLO 返回缺陷框
  -> 服务端合并结果并返回标签
  -> 客户端保存标签
  -> 客户端渲染结果图
  -> 写入数据库并更新统计
```

### 前后端检测链路伪代码

```text
function detectFromClient(selectedImages):
  disable detect button
  clear previous progress

  for image in selectedImages:
    update progress bar
    response = call FastAPI detection endpoint

    if response failed:
      write error log
      mark image as failed
      continue

    save labels to project result folder
    render preview with class colors
    write defects into database
    update class statistics

  enable manual correction
  enable report export
```

这段伪代码强调的是客户端职责：调用服务、保存结果、刷新界面，而不是把所有逻辑都塞进检测脚本。

## 为什么检测结果要保存为标签

如果只保存结果图片，后续会遇到很多限制：

- 不能灵活修改类别颜色。
- 不能按类别筛选。
- 不能进入 LabelMe 复核。
- 不能统计每一类缺陷数量。
- 不能映射到三维坐标。
- 不能生成结构化报告。

所以系统保存的是标签数据。图片只是展示结果，标签才是项目后续流程的核心数据。

标签至少需要包含：

- 缺陷类别。
- 框坐标。
- 置信度。
- 来源：模型或人工。
- 所属图片。
- 复核状态。
- 可选三维坐标。

## UI 设计重点

这类桌面系统不需要花哨，关键是稳定和清楚。我的 UI 设计重点是：

- 用户知道当前打开的是哪个项目。
- 用户知道图片是否已经检测。
- 用户知道检测失败的原因。
- 用户能快速切换原图和结果图。
- 用户能看到类别统计。
- 用户能进入人工复核和报告导出。

![检测系统界面截图](/blog-assets/detection-ui-result.png)

> 检测系统结果界面：展示检测前后视图、类别统计和结果复核入口。

![检测系统结果界面](/blog-assets/detection-ui-result.png)

## 线程和卡顿问题

PyQt 桌面端最容易出现的问题是界面卡死。检测、报告导出、模型加载都可能耗时，如果直接在主线程执行，用户体验会很差。

我的处理原则是：

- 检测请求放到工作线程。
- 报告导出放到后台线程。
- UI 只负责状态更新。
- 长任务必须有进度反馈。
- 异常必须写日志。

这样即使某张图检测失败，也不会导致整个系统卡死。

## 工程目录设计

项目目录要能长期保存和迁移，不能把所有文件随意散落。

一个简化目录结构如下：

```text
project/
  images/
    raw/
    preview/
  labels/
    model/
    reviewed/
  model/
    osgb/
    metadata/
  reports/
    assets/
    output.docx
  logs/
  project.db
```

这样做的好处是：

- 原始数据和结果数据分开。
- 模型检测结果和人工复核结果分开。
- 报告资产可以单独管理。
- 数据库只保存索引和结构化记录。
- 迁移项目时目录关系清晰。

## 这个架构的优点和限制

优点：

- 客户端和模型推理解耦。
- 模型替换比较方便。
- 结果可以进入复核、三维定位和报告模块。
- 桌面端适合本地数据和三维模型浏览。

限制：

- 本地部署依赖较多。
- PyQt + OSG + LabelMe 打包复杂。
- FastAPI 服务需要处理端口、启动和异常。
- 大图批量检测时仍要关注性能。

## 小结

这个系统的核心不是“PyQt 调一次 YOLO”，而是把检测模型放进一个完整工程流程里：

```text
项目管理
  -> 图片检测
  -> 结果保存
  -> 人工复核
  -> 三维定位
  -> 报告导出
```

PyQt + FastAPI 的拆分让界面、数据和模型推理各自保持清晰边界，也为后续三维联动和报告生成打下基础。
