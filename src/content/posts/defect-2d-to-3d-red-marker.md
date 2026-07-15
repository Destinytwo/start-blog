---
title: "三维模型打红点：二维缺陷框到三维坐标的计算思路"
published: 2026-06-27
updated: 2026-07-14
draft: false
description: "记录在三维模型上标红点的算法思路：把二维图片中的缺陷检测结果计算到三维模型坐标中。"
image: "/blog-assets/linkage-flow.svg"
tags: ["三维红点", "缺陷定位", "反投影"]
category: "建筑缺陷项目"
author: "Funny"
---

## 红点为什么不是简单贴图

这篇记录的是我在武汉市测绘研究院算法实习期间参与的外立面缺陷检测科研项目中的三维缺陷点定位部分。

在建筑外立面缺陷检测系统里，三维模型上的红点必须有真实空间含义。它不能只是贴在当前屏幕截图上的一个图标，否则模型一旋转、一缩放、一切换视角，红点就失去意义。

所以三维红点本质上是一个空间点：

```text
Marker:
  x, y, z
  category
  source_image
  defect_box
  confidence
```

这个点需要来自二维照片中的缺陷框，并且能够在 OSGB 模型坐标系下稳定显示。

![三维红点定位流程图](/blog-assets/linkage-flow.svg)

> 红点定位示意图：从二维框到三维点，再进入模型显示和报告统计。

## 输入和输出

红点计算的输入包括：

- 原始照片尺寸。
- 缺陷检测框坐标。
- 相机内参。
- 相机外参。
- 照片位姿。
- OSGB 模型坐标信息。
- SRSOrigin 或模型原点信息。

输出是：

- 模型局部坐标或工程坐标。
- 缺陷类别。
- 对应照片和检测框。
- 后续去重所需的空间索引。

## 计算链路

简化后的计算链路如下：

```text
缺陷框
  -> 代表点
  -> 相机射线
  -> 世界坐标射线
  -> 模型表面落点
  -> 坐标转换
  -> 三维红点
```

代表点可以取检测框中心，也可以根据缺陷类别选择更合理的位置。比如裂缝细长，框中心可能不一定落在最典型的缺陷区域；剥落类目标则中心点通常更稳定。

## 落点计算方式

理想情况下，可以让相机射线直接和三维模型表面求交，得到最准确的落点。

但工程实现中会遇到几个问题：

- OSGB 模型数据量大，直接求交可能慢。
- 模型表面存在孔洞或不连续。
- 射线可能打到窗户、遮挡物或错误表面。
- 检测框中心不一定对应缺陷的真实深度。

因此实际项目里可以根据阶段选择不同策略：

| 策略 | 优点 | 缺点 |
| --- | --- | --- |
| 射线与模型求交 | 空间含义最明确 | 实现复杂，性能要求高 |
| 近似平面求交 | 速度快，适合立面 | 对复杂凹凸结构不够准确 |
| 采样最近模型点 | 可结合模型数据 | 需要空间索引 |
| 人工确认点位 | 最可靠 | 效率低 |

项目原型阶段，我更关注链路跑通和可视化验证，再逐步优化落点精度。

## 红点生成伪代码

```text
function projectDefectBoxToModel(defect, camera, model):
  point2d = chooseRepresentativePoint(defect.box)
  ray = pixelToWorldRay(point2d, camera)

  hit = intersectRayWithModel(ray, model)
  if hit not found:
    hit = intersectRayWithFacadePlane(ray, model.estimatedFacadePlane)

  modelPoint = convertWorldToModelLocal(hit.worldCoordinate)
  return modelPoint
```

这段伪代码保留的是主要逻辑。真实系统里还需要异常处理，例如无交点、坐标超出模型范围、相机参数缺失等。

## 多照片重复缺陷

建筑外立面通常会被多张照片覆盖。同一处缺陷可能在不同角度或不同距离的照片里被检测到。如果每个检测框都生成一个红点，模型上会出现一堆很近的点，报告统计也会重复。

所以必须做去重。

去重判断可以结合：

- 三维距离。
- 缺陷类别。
- 所属楼层或高度范围。
- 原始照片拍摄方向。
- 检测框置信度。
- 人工复核状态。

### 三维红点生成和去重伪代码

```text
function build3DMarkers(defects):
  markers = []

  for defect in defects:
    point = projectDefectBoxToModel(defect)
    candidate = findNearbyMarker(
      markers,
      point,
      sameCategory = true,
      maxDistance = thresholdByCategory(defect.category)
    )

    if candidate exists:
      candidate.merge(defect, point)
      candidate.confidence = max(candidate.confidence, defect.confidence)
    else:
      markers.append(new Marker(point, defect.category, defect))

  return markers
```

这里的阈值不能写死。裂缝、剥落、露筋等类别的空间尺度不同，去重阈值也应该不同。

## 可视化验证

红点计算完成后，必须通过可视化验证。我的检查方式是：

- 在二维照片中找到明显缺陷。
- 查看系统生成的三维红点。
- 旋转模型确认红点是否贴近建筑表面。
- 对比同一缺陷在多张照片里的红点是否被合并。
- 检查报告里是否只统计一次。

![二维照片检测框和三维模型红点对照图](/blog-assets/photo-3d-marker-linkage.png)

> 二维照片与三维红点对照：用于检查三维定位是否落在合理位置。

![二维照片与三维红点对照](/blog-assets/photo-3d-marker-linkage.png)

## 常见偏移原因

红点偏移时，不要一上来怀疑模型检测结果。更常见的问题是坐标链路：

- 忘记处理 SRSOrigin。
- 世界坐标和模型局部坐标混用。
- 相机外参矩阵方向用反。
- 检测图片尺寸和空三照片尺寸不一致。
- 图像经过裁剪或缩放但坐标没还原。
- 模型切割后坐标没有重新校验。

排查时最好逐步打印中间结果，而不是只看最终红点。

## 小结

三维红点功能把项目从“二维检测”推进到了“空间巡检”。

它的核心不是画一个点，而是完成一条链路：

```text
二维检测框
  -> 相机几何
  -> 三维落点
  -> 缺陷去重
  -> 模型展示
  -> 报告统计
```

这也是建筑外立面缺陷检测系统和普通图片检测 demo 的重要区别。
