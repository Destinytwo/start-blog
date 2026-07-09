---
title: "OSGB 实景三维模型加载与 OSGViewer 踩坑记录"
published: 2026-06-29
updated: 2026-06-29
draft: false
description: "整理 OSGB 实景三维模型加载过程中的工程问题：瓦片索引、metadata.xml、Qt 嵌入、光照和交互控制。"
image: "/blog-assets/osgb-viewer-main-building.png"
tags: ["OSGB", "OSGViewer", "Qt 嵌入"]
category: "建筑缺陷项目"
author: "Funny"
---

## OSGB 不是单个模型文件

实景三维成果通常包含 metadata.xml、Data/Tile_* 瓦片目录、纹理和多个 OSGB 文件。系统需要识别主索引、处理瓦片路径，并保证模型能在客户端里稳定加载。

如果只把它当成一个普通三维模型文件，很容易遇到路径缺失、纹理丢失或加载范围异常的问题。

## 客户端嵌入的细节

标准 OSGViewer 直接嵌入 PyQt 容易出现窗口和生命周期问题。我采用自定义查看器，并通过 Qt 容器嵌入三维窗口。

三维模型模块的目标不是做一个独立三维软件，而是让巡检系统能稳定加载模型、拾取表面点、显示工程坐标，并和二维照片候选匹配联动。

- 识别 ContextCapture/Smart3D 成果结构
- 处理主 OSGB、代理索引和瓦片加载
- 关闭不合适的光照和惯性旋转，提升巡检浏览体验
- 在界面中展示点击点工程坐标，为二维三维联动做准备

### OSGB 加载与嵌入伪代码

```text
function loadRealityModel(project):
  metadata = find metadata file
  rootTile = detect root osgb or build proxy index
  viewer = start custom OSG viewer(rootTile)
  qtWindow = embed viewer window into PyQt panel
  origin = read spatial origin(metadata)
  on viewer.pick(point):
    worldPoint = point + origin
    show worldPoint in UI
    search related photos(worldPoint)
```

伪代码保留模型加载和点拾取的结构，便于说明查看器与 Qt 窗口的协作方式。

三维窗口截图用于展示 OSGB 模型在客户端中的加载效果。

![OSGB 模型加载界面截图](/blog-assets/osgb-viewer-main-building.png)

> OSGB 模型加载界面：展示切割后的主要楼栋在三维查看器中的加载效果。
