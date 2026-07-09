---
title: "UAV-SmallDet 创新点二：STFL-Neck 与浅层高分辨率特征"
published: 2025-12-12
updated: 2025-12-12
draft: false
description: "记录 SmallDet 中第二个创新点：利用浅层高分辨率特征改善无人机小目标的定位和召回。"
image: "/blog-assets/smalldet-p2-stfl-neck.svg"
tags: ["STFL-Neck", "P2", "特征融合"]
category: "SmallDet"
author: "Funny"
---

## 为什么关注浅层特征

小目标在深层特征图上可能只剩很少像素，甚至在连续下采样过程中被背景纹理吞掉。对于无人机图像里的远距离车辆、行人或小型设施，如果只依赖 P3、P4、P5 等较深层特征，检测头拿到的信息往往已经缺少边界和中心位置。

浅层特征的优势是分辨率高，能够保留更多空间细节；劣势是语义弱，容易把纹理、阴影和重复结构当成目标。STFL-Neck 的核心问题就是：如何让高分辨率细节参与检测，同时不把浅层噪声直接放大。

因此这篇笔记把 STFL-Neck 理解成一个面向小目标的特征组织策略。它不是单纯多接一条 P2 分支，而是要解决通道对齐、语义补充、上下采样融合和检测头分配之间的关系。

## 结构图阅读方式

从 P2 结构图可以看到，高分辨率浅层特征被纳入 Neck 的融合路径。阅读这类结构图时，不要只看箭头数量，而要看每条路径解决什么问题：浅层路径提供位置细节，深层路径提供类别语义，横向连接负责通道对齐，自顶向下和自底向上的路径负责信息交换。

P2 分支的加入会让检测头看到更细的网格，这对极小目标召回很重要。问题在于，高分辨率特征图计算量更大，也更容易引入背景噪声。因此结构中通常需要压缩通道、筛选有效特征或用轻量化融合方式控制成本。

在实验解释中，可以把 STFL-Neck 的价值概括为两句话：第一，它把小目标还没有被下采样抹掉的空间信息接回检测路径；第二，它让浅层细节在深层语义约束下被使用，而不是直接把噪声交给检测头。

- 保留 P2 等浅层高分辨率特征
- 减少小目标定位信息在下采样中的损失
- 通过融合结构平衡细节和语义
- 用通道对齐和轻量融合控制计算量
- 观察召回率提升时是否伴随误检上升

![STFL-Neck 特征融合结构图](/blog-assets/smalldet-p2-stfl-neck.svg)

> STFL-Neck / P2 融合结构示意：重点展示浅层高分辨率特征如何并入 Neck，用于提升小目标定位和召回。

## 伪代码拆解

下面的伪代码表达的是 STFL-Neck 的信息流：先取出高分辨率浅层特征，再把深层语义做自顶向下融合，最后让浅层细节和语义特征在统一通道空间中融合。

这里把关键步骤抽象出来，读者更容易理解为什么 P2 分支对小目标有效。

### STFL-Neck 融合伪代码

```text
function STFL_Neck(features):
  p2 = select_high_resolution_feature(features)
  p3, p4, p5 = select_semantic_features(features)

  semanticPyramid = top_down_fusion(p3, p4, p5)
  p2Aligned = align_channels(p2)
  semanticForP2 = resize_to_match(semanticPyramid.lowest_level, p2Aligned)

  smallTargetFeature = gated_fusion(p2Aligned, semanticForP2)
  outputPyramid = build_detection_pyramid(smallTargetFeature, semanticPyramid)

  return outputPyramid
```

这段伪代码强调浅层高分辨率特征参与融合，不展开具体层实现。

gated_fusion 表示受语义约束的融合思想，避免浅层纹理噪声被直接放大。

outputPyramid 仍然保留多尺度检测路径，P2 只是其中面向小目标的重要补充。

## 实验观察

整理消融实验时，需要重点对比加入浅层分支前后的召回率、定位误差和小目标类别上的 mAP 变化。STFL-Neck 的收益通常不应该只体现在总体 mAP，还应该体现在远距离、小尺寸、密集区域目标的检出数量上。

浅层特征的引入不能只看总体指标，还要看小目标密集区域的可视化效果。如果召回提升但误检也明显变多，就需要继续检查融合权重、通道压缩和检测头分配。尤其是无人机场景中道路纹理、建筑边缘、树影和车辆阴影都可能成为误检来源。

从工程角度看，P2 分支还会带来推理成本变化。算法研究不是只追求指标，还要考虑是否适合系统部署。对于建筑缺陷检测这类大图场景，浅层特征和切片推理结合时，既能保留小缺陷细节，也要关注推理耗时。

- 对比加入 P2 前后的 Recall、mAP@0.5 和 mAP@0.5:0.95
- 单独观察小目标类别，而不是只看全部类别平均值
- 整理可视化结果，判断新增检出是否是真目标
- 记录推理速度变化，避免高分辨率分支让模型过重

![SmallDet 不同场景检测效果图](/blog-assets/smalldet-qualitative-scenes.svg)

> 不同场景检测效果适合用来观察 STFL-Neck 对密集小目标、远距离目标和复杂背景目标的影响。
