---
title: "建筑缺陷检测数据集整理：从裂缝数据到外立面场景"
published: 2026-07-03
updated: 2026-07-03
draft: false
description: "整理建筑缺陷检测数据准备过程：数据集筛选、标注格式转换、LabelMe 标注、不可用样本剔除和类别统一。"
image: "/blog-assets/dataset-pipeline.svg"
tags: ["数据集", "LabelMe", "标注质检"]
category: "建筑缺陷项目"
author: "Funny"
---

## 数据集不是越多越好

项目早期对多个裂缝和房屋缺陷数据集做过训练测试，但不同数据集的拍摄距离、缺陷类别、标注粒度和图像质量差异很大。

如果直接混合使用，模型可能学到的是某个数据集的拍摄风格，而不是外立面缺陷本身。

## 整理流程

比较有效的方式是先做可视化审查，再筛掉不可用样本，最后统一类别和标注格式。

我把数据集整理看成模型训练之前的第一轮实验。如果标签质量不稳定，后面再换模型、调学习率、加数据增强都很难判断到底是哪一步有效。

- 把 XML、JSON 等标注格式统一转换为 YOLO 训练格式
- 用可视化脚本检查框是否偏移、漏标或类别混乱
- 用 LabelMe 补充现场场景中缺失的缺陷标注
- 将裂缝、剥落等类别命名保持一致，避免训练时类别语义混乱

### 标注质检和格式转换伪代码

```text
function buildTrainingLabels(dataset):
  cleanSamples = []
  for sample in dataset:
    labels = parseAnnotation(sample.annotation)
    preview = drawLabels(sample.image, labels)
    if humanReview(preview) == "bad":
      recordRejectReason(sample)
      continue
    yoloLabels = convertToYolo(labels, sample.imageSize)
    cleanSamples.append(sample.image, yoloLabels)
  export cleanSamples into train/val/test folders
```

这段伪代码强调“先看标注，再进训练”，把数据质检放在模型训练之前。

LabelMe 截图用于说明标注审查、补标和类别统一的操作流程。

![建筑缺陷数据集整理流程图](/blog-assets/dataset-pipeline.svg)

> 数据集整理流程：审查、转换、补标、训练。只有干净一致的标签才进入训练集。

![LabelMe 标注截图](/blog-assets/labelme-manual-annotation.png)

> LabelMe 手工标注截图：用于展示数据审查、补标和类别统一的实际工作流。
