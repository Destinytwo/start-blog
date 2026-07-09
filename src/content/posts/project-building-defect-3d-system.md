---
title: "基于实景三维模型的建筑物缺陷检测系统"
published: 2026-07-06
updated: 2026-07-06
draft: false
description: "围绕建筑外立面巡检场景，构建实景三维模型、航拍二维影像、缺陷检测模型和报告导出的完整闭环。"
image: "/blog-assets/detection-ui-result.png"
tags: ["Python", "PyQt5", "FastAPI", "SAHI", "Ultralytics", "OpenSceneGraph", "SQLite"]
category: "建筑缺陷项目"
author: "Funny"
---

## 项目概览

围绕建筑外立面巡检场景，构建实景三维模型、航拍二维影像、缺陷检测模型和报告导出的完整闭环。

项目阶段：已完成

项目结果：完成从实景三维模型加载、航拍影像检测、缺陷空间定位到报告生成的工程闭环

- 基于 OSGB 实景三维模型和 UAV 空三参数实现三维点与二维照片联动
- 使用 SAHI 与 Ultralytics 检测航拍影像中的裂缝、剥落、露筋、泛碱等缺陷
- 将检测框映射为空间坐标，支持三维红点、缺陷去重、统计和 Word 报告导出

![建筑物缺陷检测系统检测结果界面](/blog-assets/detection-ui-result.png)

> 基于实景三维模型的建筑物缺陷检测系统

## 项目背景

建筑外立面巡检依赖人工高空作业时，存在成本高、效率低和安全风险。这个项目尝试把无人机航拍、实景三维模型和目标检测算法结合起来，让缺陷能够在二维照片中识别，并回到三维空间中定位。

项目数据包含 UAV 航拍影像、空三结果和 OSGB 实景三维模型。系统需要同时处理图像检测、三维模型显示、坐标映射、缺陷管理和最终报告输出。

这类项目的难点不只是把模型训练出来。真正进入工程流程后，会遇到高分辨率图片缩放导致小缺陷丢失、三维模型数据量大、空三坐标和模型坐标需要对齐、人工复核必须可追溯、报告导出不能卡住界面等问题。

因此我把它定义为一个完整的巡检系统原型：算法负责发现缺陷，三维模型负责表达空间位置，客户端负责把流程串起来，报告模块负责形成可交付结果。

![建筑缺陷检测系统架构示意图](/blog-assets/system-architecture.svg)

> 系统架构示意图：展示客户端、检测服务、数据管理和报告导出之间的模块关系。

![系统首页截图](/blog-assets/building-system-home.png)

> 系统首页：展示建筑缺陷检测系统的入口和整体功能组织。

![项目管理界面截图](/blog-assets/project-management-ui.png)

> 项目管理界面：展示项目打开、数据管理和流程入口，便于说明系统如何组织巡检任务。

## 系统方案

系统采用客户端与检测服务分离的结构。客户端基于 PyQt5 构建，负责项目管理、OSGB 模型加载、二维照片浏览、检测结果展示、LabelMe 手工修正和报告导出；服务端基于 FastAPI 提供图像检测接口。

检测端使用 SAHI 的切片推理能力接入 Ultralytics 模型，适配航拍图像中目标小、分布密集、背景复杂的特点。客户端把返回的检测框保存为标签文件和数据库记录，再结合空三参数完成三维定位。

这样的拆分有两个好处：第一，界面不会被模型推理逻辑绑死，模型替换更清晰；第二，检测服务可以独立记录推理耗时、显存状态和错误信息，便于调试和部署。

### 客户端发起检测的伪代码

```text
function runDetection(project, imageList):
  ensure project has output directories
  for each image in imageList:
    show progress(image.name)
    response = request detection_service.detect(image)
    labelFile = save response.labels into project output
    preview = render labels on local image
    update image panel with preview
    write defects into database
  refresh statistics panel
  enable manual review and report export
```

这不是实际代码，只保留流程逻辑。工程实现里会有异常处理、线程通信、路径兼容和前后端接口参数。

关键思想是：后端只负责推理和返回结构化结果，客户端负责保存、展示、复核和写入项目上下文。

## 核心能力

项目的重点不是单独训练一个模型，而是把模型推理接入真实工程流程，形成可操作的巡检系统。它从数据导入开始，到检测、复核、三维定位、去重统计、报告导出结束，形成一个闭环。

其中最有辨识度的是二维和三维的联动：二维照片里的检测框不是孤立结果，而是可以通过空三参数和模型坐标转换，变成三维模型上的缺陷点。

- 项目数据库管理：记录项目、三维模型、空三成果、二维照片和缺陷信息
- 三维二维联动：点击三维模型点位后自动匹配最合适的去畸变照片
- 缺陷检测与修正：批量检测航拍图像，并支持 LabelMe 对结果进行人工复核
- 空间定位与去重：将二维检测框反投影到三维模型，合并多照片中的重复缺陷
- 报告输出：按唯一缺陷生成统计表、楼层切面图和 Word 检测报告

![二维缺陷框映射到三维缺陷点的流程图](/blog-assets/linkage-flow.svg)

> 二维到三维联动示意图：从检测框、相机位姿到三维模型红点，说明坐标链路和数据流。

## 数据与模型训练复盘

项目早期尝试过多类裂缝和房屋缺陷数据，也做过旋转、亮度变化等增强。后来发现，高分辨率建筑外立面图像直接缩放输入模型，会让裂缝、剥落等小缺陷在特征层里变得很弱。

因此训练思路逐步从“直接训练整图检测”调整为“数据筛选 + 标注质检 + SAHI 切片 + 现场场景复核”。这比单纯换更大的 YOLO 模型更重要。

- 先做标注可视化，剔除框偏移、漏标严重和类别混乱的样本
- 把不同来源和不同场景的数据分开分析，避免训练集风格污染判断
- 对高分辨率图像使用切片训练或切片推理，保留缺陷有效像素
- 人工复核漏检目标，让修正结果可以回流到数据迭代

### 数据进入训练前的伪代码

```text
function prepareDataset(rawSamples):
  reviewed = []
  for sample in rawSamples:
    labels = load labels(sample)
    if labels are missing or shifted:
      mark sample as rejected
      continue
    normalizedLabels = convert to unified format(labels)
    reviewed.append(sample.image, normalizedLabels)
  trainSet, valSet, testSet = split reviewed by scene
  return trainSet, valSet, testSet
```

这里强调按场景拆分，而不是随机把相邻照片打散，否则验证集可能过于乐观。

这一步强调数据处理原则：先保证样本质量，再进入训练流程。

## 三维模型预处理与 DasViewer 切割

我用 DasViewer 对实景三维模型做预处理，把大范围场景中的主要楼栋单独切出来。这样能减少周边道路、绿化和附属建筑对展示的干扰，也方便楼栋级缺陷统计。

切割模型后不能只看视觉上是否变小，还要检查坐标、纹理、瓦片索引和 SRSOrigin 是否仍然一致。只要坐标链路发生偏移，二维照片和三维红点的对应关系就会出错。

### 三维模型切割后的校验伪代码

```text
function validateCutModel(fullModel, cutModel):
  load cutModel in viewer
  check textures are not missing
  origin = read spatial origin metadata
  bbox = compute scene bounding box
  for each known test point:
    localPoint = pick point on cutModel surface
    worldPoint = localPoint + origin
    assert worldPoint is in expected building range
  return validation report
```

这段伪代码只表达校验思路：加载、检查纹理、读取原点、点选表面、确认坐标范围。

这段流程强调加载、检查纹理、读取原点、点选表面和确认坐标范围。

![DasViewer 从完整场景切割主要楼栋的示意图](/blog-assets/dasviewer-cut-workflow.svg)

> DasViewer 切割流程示意图：完整场景先被裁剪，只保留主要楼栋用于三维展示和定位。

![DasViewer 切割前后对比截图](/blog-assets/dasviewer-cut-before-after.png)

> DasViewer 切割前后对比：从大范围场景中裁出主要楼栋，服务三维定位和报告展示。

## 报告导出与工程交付

报告模块把项目从“能看结果”推进到“能交付结果”。报告中需要汇总项目信息、照片信息、缺陷明细、类别统计和楼层切面图，同时还要避免 Word 文件过大、中文字体异常和导出时界面卡死。

我采用后台线程导出报告，并把原图、切面图等大文件放到报告资产目录中，通过链接引用，减少文档体积，也便于迁移和归档。

### 报告导出的伪代码

```text
function exportReport(project):
  start background worker
  defects = query unique defects ordered by floor
  stats = group defects by category
  sections = generate floor section images(defects)
  document = create word document
  add project summary, stats table, defect details
  link original photos and section images
  save document into report directory
  notify UI export finished
```

这段流程展示的是系统闭环和工程判断：缺陷记录、统计信息、切面图和报告文档之间如何衔接。

报告截图用于说明导出流程、统计信息和切面图如何组织。

![缺陷检测报告导出流程示意图](/blog-assets/report-flow.svg)

> 报告导出流程示意图：缺陷记录、楼层切面和统计信息最终汇总到 Word 报告。

![Word 报告截图](/blog-assets/report-export-ui.png)

> 报告导出界面：展示报告生成入口和导出流程，说明系统最终如何形成可交付结果。

![楼层切面报告图](/blog-assets/floor-section-report.png)

> 楼层切面图：用于在报告中展示缺陷点位和楼层轮廓关系。

## 工程收获

这个项目让我把计算机视觉算法、三维 GIS/OSGB 模型、桌面客户端、后端服务和工程化打包串在了一起。相比单纯算法实验，它更接近真实应用系统，需要持续处理数据路径、运行时依赖、交互体验和结果可信度。

如果把它放到个人网站里，它不是一个“模型训练案例”，而是一个完整的工程案例：有数据准备、有模型推理、有三维联动、有人工复核、有报告导出，还有可部署的桌面端。

我把这个项目拆成多篇技术文章，每篇只讲一个具体问题：SAHI 为什么有效、OSGB 怎么加载、二维三维怎么对齐、报告怎么生成、打包为什么选择 onedir。这样能更清楚地展示工程深度。

![桌面端发布目录结构示意图](/blog-assets/packaging-runtime.svg)

> 工程交付示意图：发布目录把主程序、外部工具、运行时环境和日志分开管理，便于部署和排错。
