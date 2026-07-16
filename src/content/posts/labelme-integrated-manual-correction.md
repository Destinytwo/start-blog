---
title: "把 LabelMe 集成进检测系统：用于人工补充漏检目标"
published: 2026-06-30
updated: 2026-07-14
draft: false
description: "记录检测系统中人工复核链路的设计：模型先自动检测，漏检目标再用 LabelMe 补充标注并写回结果。"
image: "/blog-assets/labelme-manual-annotation.png"
tags: ["LabelMe", "人工复核", "漏检修正"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么检测系统必须支持人工复核

本文记录外立面缺陷检测科研项目中的人工复核链路。

建筑外立面缺陷检测很难只靠模型一次性完成。实际照片里会有窗框、阴影、污渍、墙面纹理、空调外机、管线等复杂干扰，模型出现漏检和误检是正常情况。

如果系统只输出模型结果，用户只能接受或放弃；如果系统支持人工复核，模型结果就可以变成一个“初筛结果”，最终由人工确认后进入报告。

因此系统将 LabelMe 集成到检测流程里，让用户可以直接对模型检测结果进行修改和补充。

![LabelMe 人工修正前后对比图](/blog-assets/labelme-manual-annotation.png)

> LabelMe 人工修正界面：模型检测后可以人工补充漏检目标，并把复核结果写回项目。

## 人工复核解决什么问题

人工复核主要解决四类问题：

1. **漏检**
   模型没有检测到某个真实缺陷，需要人工新增框。

2. **误检**
   模型把阴影、污渍、窗框等误认为缺陷，需要删除框。

3. **类别错误**
   模型检测到了目标，但类别判断错了，需要修改类别。

4. **框不准确**
   检测框偏大、偏小或偏移，需要人工调整。

这些问题如果不处理，后续三维定位、统计和报告都会被影响。

## 为什么选择 LabelMe

LabelMe 的优势是简单、通用、易集成：

- 支持常见图片标注。
- JSON 格式易解析。
- 可以手动新增、删除、修改框。
- 对 Python 项目友好。
- 不需要重新做一套标注工具。

没有在 PyQt 里重写完整标注工具，而是把 LabelMe 作为外部复核工具接入。这样开发成本更低，也更稳定。

## 系统集成流程

整体流程如下：

```text
模型检测
  -> 保存初始检测标签
  -> 用户点击人工复核
  -> 系统打开 LabelMe
  -> 用户修改或新增标注
  -> 系统读取 LabelMe 输出
  -> 合并模型框和人工框
  -> 写回项目数据库
```

这里的关键不是“打开 LabelMe”，而是复核结果如何和原始模型结果合并。

## 保留模型结果和人工结果

一个重要设计是保留来源字段。

模型检测框应保留：

- 类别。
- 坐标。
- 置信度。
- source = model。

人工新增框应保存：

- 类别。
- 坐标。
- 置信度设为 1.00 或特殊值。
- source = manual。

人工修改过的模型框也需要记录复核状态，例如 reviewed = true。

这样做的好处是：后续可以统计模型漏检、误检和人工修改情况，为数据集迭代提供依据。

### 合并模型框和人工框的伪代码

```text
function mergeManualLabels(modelLabels, manualLabels):
  merged = []

  for label in modelLabels:
    if label removed by reviewer:
      record false positive sample
      continue

    if label modified by reviewer:
      label.reviewed = true
      label.source = "model_reviewed"

    merged.append(label)

  for label in manualLabels:
    if label is new defect:
      label.confidence = 1.00
      label.source = "manual"
      label.reviewed = true
      merged.append(label)

  save merged labels
  update project database
```

这段伪代码表达的是数据设计思想：人工复核不是覆盖模型结果，而是给模型结果增加审查信息。

## 文件格式转换

系统里可能同时存在多种标签格式：

- 模型输出的 YOLO txt。
- LabelMe 输出的 JSON。
- 系统内部数据库记录。
- 报告导出需要的结构化缺陷表。

所以中间需要一个统一结构，例如：

```text
DefectLabel:
  image_id
  category
  x1, y1, x2, y2
  confidence
  source
  reviewed
  created_at
```

只要内部结构统一，后续无论是渲染图片、进入三维定位，还是导出报告，都可以复用。

## 人工复核对数据闭环的意义

人工补充的框不只是“修一下结果”，它还有更长期的价值：

- 漏检样本可以加入训练集。
- 误检样本可以作为负样本分析。
- 类别混淆可以帮助调整类别定义。
- 框偏移可以暴露标注规范问题。

工程系统比单次模型推理更有价值的地方在于：系统会把模型问题沉淀下来，后续可以迭代。

![LabelMe 人工复核界面](/blog-assets/labelme-manual-annotation.png)

## 集成过程中的注意点

### 1. 路径不能混乱

LabelMe 打开的是图片，输出的是 JSON。如果项目目录和图片路径处理不好，很容易出现 JSON 指向错误图片的问题。

处理方式是：复核文件统一放在项目目录下，由系统生成和读取，不依赖用户手动移动文件。

### 2. 不要覆盖原始模型结果

原始检测结果应保留一份，人工复核结果另存一份。这样可以追溯模型初始表现，也方便后续做误差分析。

### 3. 复核后要刷新统计

人工修改后，类别统计、缺陷总数、报告明细都要重新计算。否则界面和报告可能不一致。

### 4. 打包时要考虑 LabelMe 运行环境

LabelMe 作为外部工具接入后，打包发布时需要准备它的运行环境。这个问题在 PyInstaller 打包文章里单独说明。

## 小结

把 LabelMe 集成进检测系统的目的不是让人工替代模型，而是让模型输出进入可复核流程。

最终系统需要的是可信结果：

```text
模型初筛
  -> 人工复核
  -> 结果回写
  -> 数据闭环
  -> 三维定位和报告导出
```

对于建筑外立面缺陷检测这种工程项目，人工复核是系统可用性的重要组成部分。
