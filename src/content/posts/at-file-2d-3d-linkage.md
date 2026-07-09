---
title: "根据空三文件实现二维照片和三维模型联动"
published: 2026-06-28
updated: 2026-06-28
draft: false
description: "梳理如何利用空三文件里的相机参数和位姿信息，把二维照片中的检测结果与三维模型中的空间位置关联起来。"
image: "/blog-assets/linkage-flow.svg"
tags: ["空三", "二维三维联动", "坐标投影"]
category: "建筑缺陷项目"
author: "Funny"
---

## 联动的核心信息

空三文件提供相机内参、外参和照片位姿等信息，这些信息可以把二维像素坐标和三维空间射线联系起来。

在建筑缺陷检测系统中，二维照片负责识别缺陷，三维模型负责表达缺陷在建筑物表面的空间位置。

## 基本流程

先在原始照片中获得缺陷框，再取框中心或关键点作为二维坐标；结合相机位姿生成空间射线；最后与三维模型表面或近似平面求交，得到三维坐标。

在系统设计上，这一步最好拆成两个阶段：先根据三维点或模型区域筛选候选照片，再在照片内做缺陷框到空间点的映射。这样可以减少无关照片参与计算，也更利于人工复核。

- 解析照片对应的相机参数和位姿
- 把像素点转换为相机坐标系下的方向
- 将方向变换到世界坐标系并与模型表面关联

### 二维像素到三维射线的伪代码

```text
function pixelToWorldRay(pixel, camera):
  normalized = inverse(camera.intrinsic) * [pixel.x, pixel.y, 1]
  cameraRay = normalize(normalized)
  worldRay = camera.rotation * cameraRay
  origin = camera.position
  return Ray(origin, worldRay)

function linkDefectToModel(defectBox, camera, model):
  center = centerPoint(defectBox)
  ray = pixelToWorldRay(center, camera)
  hit = intersect(ray, model.surface)
  return hit.worldCoordinate
```

这是几何关系的伪代码，工程系统还要处理畸变、坐标原点、模型局部坐标和多照片重复缺陷。

文章里可以讲清楚为什么需要空三文件：它提供照片和三维空间之间的桥梁。

![二维检测框到三维红点的联动流程](/blog-assets/linkage-flow.svg)

> 二维三维联动示意图：从检测框中心出发，结合相机位姿生成射线，再落到三维模型表面。

![二维照片检测框和三维模型红点对照图](/blog-assets/photo-3d-marker-linkage.png)

> 二维照片与三维红点对照：用于说明检测框如何联动到三维模型中的缺陷点位。
