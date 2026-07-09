---
title: "DasViewer 切割实景三维模型：只保留主要楼栋"
published: 2026-07-06
updated: 2026-07-06
draft: false
description: "记录用 DasViewer 对实景三维模型做切割，把主要楼栋从大范围场景中单独裁出来，方便模型加载、检测点展示和报告生成。"
image: "/blog-assets/dasviewer-cut-workflow.svg"
tags: ["DasViewer", "实景三维", "模型预处理"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么要切割三维模型

原始实景三维成果往往包含目标楼栋、周边道路、绿化、附属建筑和很多与缺陷检测无关的场景。直接加载完整模型会增加浏览负担，也会影响楼栋级缺陷展示。

用 DasViewer 把主要楼栋切出来后，三维界面更聚焦，模型加载和交互也更容易围绕目标建筑组织。

## 切割后的收益

三维模型预处理不是单纯为了让模型变小，更重要的是让检测系统的空间对象变清楚：项目关注哪一栋楼，缺陷红点应该落在哪个建筑表面，报告里的楼层切面应该围绕哪个范围生成。

- 减少无关场景干扰，提升三维浏览和点位复查效率
- 降低 OSGB 加载压力，便于发布和迁移测试
- 让缺陷红点、楼层切面和统计报告围绕主要楼栋组织
- 让三维展示聚焦主要楼栋，减少无关场景干扰

## 切割后的校验点

切割后的校验重点是模型坐标、SRSOrigin、纹理路径和瓦片索引是否保持一致。如果局部坐标或工程坐标发生偏移，二维照片和三维模型的联动就可能出现位置偏差。

这一点很重要：三维模型切割看上去像一个可视化操作，但对检测系统来说，它会影响三维拾取、红点显示、楼层切面和报告统计。只要模型裁剪后坐标链路不稳定，前面检测出来的二维缺陷框就无法可靠落到三维表面。

### 切割模型校验伪代码

```text
function cutMainBuilding(fullScene):
  open fullScene in model viewer
  select region around target building
  export cut model as sanitized scene
  reload cut model
  verify textures, tiles, and origin metadata
  pick several surface points
  compare picked points with expected building range
  approve model only after linkage test passes
```

伪代码保留的是操作和校验顺序，便于理解模型切割后的检查流程。

切割前后对比图突出场景裁剪结果和主要楼栋的保留效果。

![DasViewer 切割主要楼栋流程图](/blog-assets/dasviewer-cut-workflow.svg)

> DasViewer 切割流程示意图：从完整场景到主要楼栋，突出模型预处理思路。

![DasViewer 切割前后对比图](/blog-assets/dasviewer-cut-before-after.png)

> DasViewer 切割前后对比：左侧为完整场景，右侧为只保留主要楼栋后的模型结果。
