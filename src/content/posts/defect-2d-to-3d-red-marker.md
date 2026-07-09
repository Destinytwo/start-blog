---
title: "三维模型打红点：二维缺陷框到三维坐标的计算思路"
published: 2026-06-27
updated: 2026-06-27
draft: false
description: "记录在三维模型上标红点的算法思路：把二维图片中的缺陷检测结果计算到三维模型坐标中。"
image: "/blog-assets/linkage-flow.svg"
tags: ["三维红点", "缺陷定位", "反投影"]
category: "建筑缺陷项目"
author: "Funny"
---

## 红点不是简单贴图

三维模型上的红点需要有真实的空间坐标，不能只停留在二维截图上。否则模型旋转、缩放或切换视角后，缺陷位置就会失去意义。

因此这个算法的本质，是把二维缺陷框中的代表点反投影到三维空间，并找到它在模型表面对应的位置。

## 计算链路

输入是检测框、照片尺寸、相机内参、相机外参和模型坐标数据；输出是可以在 OSG/OSGB 场景中绘制的三维点坐标。

工程上还要考虑多个照片看到同一个缺陷的情况。同一处裂缝或剥落可能在多张照片中被检测到，如果不去重，三维模型上会出现多个很近的红点，报告统计也会重复。

- 选择缺陷框中心点或更稳定的缺陷区域关键点
- 从像素坐标生成相机射线并转换到世界坐标系
- 通过射线求交、深度估计或模型采样得到落点
- 对同一缺陷的多个视角结果做去重和融合

### 三维红点生成和去重伪代码

```text
function build3DMarkers(defects):
  markers = []
  for defect in defects:
    point = projectDefectBoxToModel(defect)
    candidate = findNearbyMarker(markers, point, sameCategory=true)
    if candidate exists:
      candidate.merge(defect, point)
    else:
      markers.append(new Marker(point, defect.category))
  return markers
```

这段伪代码表达去重思想：位置接近且类别相同的缺陷可以合并为一个唯一缺陷。

具体距离阈值、楼层判断和类别规则需要结合项目数据调试。

![三维红点定位流程图](/blog-assets/linkage-flow.svg)

> 红点定位示意图：从二维框到三维点，再进入模型显示和报告统计。
