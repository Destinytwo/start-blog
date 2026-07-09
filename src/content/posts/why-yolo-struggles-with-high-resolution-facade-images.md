---
title: "为什么高分辨率建筑外立面图片不能直接丢给 YOLO"
published: 2026-07-05
updated: 2026-07-05
draft: false
description: "复盘建筑外立面检测中的第一个关键问题：原图分辨率很高，但模型输入缩放会让裂缝、剥落等小缺陷细节丢失。"
image: "/blog-assets/sahi-tiling-workflow.svg"
tags: ["YOLO", "高分辨率图像", "小目标检测"]
category: "建筑缺陷项目"
author: "Funny"
---

## 问题来自输入缩放

无人机远距离拍摄的建筑外立面图像通常分辨率很高，缺陷区域却很小。把整张图直接缩放到 YOLO 的训练或推理尺寸后，小缺陷的像素占比会被进一步压缩。

这会造成一个反直觉现象：原图看起来很清楚，但模型实际看到的是被压缩后的图，裂缝、剥落边缘和细小纹理可能已经不明显了。

## 实验中暴露的问题

用小块裂缝数据训练出来的模型，在局部图片上指标可能不错，但直接拿去检测完整楼面时，泛化效果会明显下降。原因不是模型完全无效，而是训练分布和现场推理分布不一致。

- 局部裂缝图更像分类式检测，完整楼面图更接近大图小目标检测
- 输入缩放会降低小缺陷可见性，影响召回率
- 现场外立面背景复杂，窗框、阴影和纹理都可能带来误检

## 解决方向

我的改进重点转向大图切片、数据集重构和现场场景标注，让训练和推理都尽量保持缺陷的有效分辨率。

判断一个目标是否会被缩放压没，可以先估算它在模型输入尺寸下剩多少像素。如果裂缝宽度、剥落边界或细小破损在输入图上只剩几个像素，模型很难稳定学习到它和背景纹理的区别。

因此文章配合“原始大图、缩放后图、切片后图”的对比图，把小缺陷在缩放和切片中的像素变化讲清楚。

### 估算缩放后缺陷尺寸的伪代码

```text
function estimateDefectPixels(originalImage, defectBox, modelSize):
  scaleX = modelSize.width / originalImage.width
  scaleY = modelSize.height / originalImage.height
  resizedWidth = defectBox.width * scaleX
  resizedHeight = defectBox.height * scaleY
  if min(resizedWidth, resizedHeight) < visibilityThreshold:
    return "risk: defect may disappear after resizing"
  return "ok: defect still has usable pixels"
```

这段伪代码解释为什么高分辨率不等于模型看得清：关键是目标缩放到输入尺寸后还剩多少有效像素。

文章里可以用这个逻辑引出 SAHI、切片训练和大图标注。

![高分辨率图片切片检测流程示意图](/blog-assets/sahi-tiling-workflow.svg)

> 大图直接缩放会压缩小缺陷；切片后再检测，可以保留更高的有效分辨率。

![高分辨率外立面图片缩放前后局部对比](/blog-assets/high-res-resize-comparison.png)

> 高分辨率图片缩放前后对比：用于说明整图缩放后，小缺陷在模型输入中会明显变小。
