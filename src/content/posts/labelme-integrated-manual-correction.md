---
title: "把 LabelMe 集成进检测系统：用于人工补充漏检目标"
published: 2026-06-30
updated: 2026-06-30
draft: false
description: "记录检测系统中人工复核链路的设计：模型先自动检测，漏检目标再用 LabelMe 补充标注并写回结果。"
image: "/blog-assets/labelme-manual-annotation.png"
tags: ["LabelMe", "人工复核", "漏检修正"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么需要人工修正

建筑缺陷检测很难只靠模型一次性完成。裂缝、剥落、污渍和阴影边界容易混淆，系统里必须允许人工复核和补充。

把 LabelMe 接进系统后，检测结果可以直接进入人工标注流程，不需要用户在多个目录和工具之间反复切换。

## 保留模型结果和人工结果

一个重要细节是保留原模型检测框的置信度，同时把人工新增目标的置信度设为 1.00。这样统计时可以区分模型预测和人工补充。

人工复核不是为了掩盖模型不足，而是为了把模型不足记录下来。漏检目标被人工补充后，可以反过来成为数据集迭代和误差分析的重要样本。

- 避免人工修正覆盖原始检测置信度
- 手工新增框可以作为漏检分析样本
- 复核后的标签可以继续进入数据集迭代

### 合并模型框和人工框的伪代码

```text
function mergeManualLabels(modelLabels, manualLabels):
  merged = copy(modelLabels)
  for label in manualLabels:
    if label is new defect:
      label.confidence = 1.00
      label.source = "manual"
      merged.append(label)
    else:
      update existing label only when reviewer confirms
  save merged labels
  keep source field for later analysis
```

source 字段是一个示例字段，用来说明模型结果和人工复核结果的来源区分。

重点是让误差分析知道哪些框来自模型、哪些框来自人工复核。

![LabelMe 人工修正前后对比图](/blog-assets/labelme-manual-annotation.png)

> LabelMe 人工修正界面：模型检测后可以人工补充漏检目标，并把复核结果写回项目。
