---
title: "SAHI 在建筑外立面缺陷检测中的作用"
published: 2026-07-04
updated: 2026-07-04
draft: false
description: "记录 SAHI + YOLOv8 在建筑外立面缺陷检测中的实践价值：切片训练、切片推理、结果合并和重复框处理。"
image: "/blog-assets/sahi-tiling-workflow.svg"
tags: ["SAHI", "YOLOv8", "建筑缺陷检测"]
category: "建筑缺陷项目"
author: "Funny"
---

## SAHI 解决的核心问题

SAHI 的关键价值是把大分辨率图像切成多个有重叠的小图，让模型在更高有效分辨率下观察缺陷，再把检测结果映射回原图。

对于建筑缺陷检测，这种方式比简单放大输入尺寸更可控，也更适合处理整面墙、屋面或外立面照片。

## 训练和推理要一起考虑

只在推理阶段切片并不一定足够。如果训练数据都是局部裂缝小图，而推理对象是完整外立面大图，模型仍然可能对现场背景不适应。

更稳的做法是让数据切片、标注转换、训练尺寸和推理切片策略形成一致流程。

切片策略本质上是在“目标可见性”和“上下文信息”之间做平衡。切片太小，模型能看清缺陷但看不到墙面上下文；切片太大，小缺陷又会被缩小。重叠比例也会影响边界缺陷的召回和重复框数量。

- 切片大小要覆盖缺陷细节，也要保留足够上下文
- 重叠区域要避免边界缺陷被切断
- 结果合并要关注重复框、边界框漂移和类别置信度

### SAHI 切片推理伪代码

```text
function sahiDetect(image, model, sliceSize, overlap):
  allPredictions = []
  slices = createOverlappedSlices(image, sliceSize, overlap)
  for slice in slices:
    localPreds = model.detect(slice.crop)
    globalPreds = mapBoxesToOriginalImage(localPreds, slice.offset)
    allPredictions.append(globalPreds)
  merged = mergeOverlappingBoxes(allPredictions)
  return merged
```

这不是实际调用代码，只表达 SAHI 的核心逻辑：切片、局部检测、坐标还原、合并结果。

工程实现里还要处理类别阈值、NMS、批量推理、显存不足回退和标签文件保存。

![SAHI 切片检测流程图](/blog-assets/sahi-tiling-workflow.svg)

> SAHI 工作流示意图：大图被切成重叠小图，检测结果再映射回原图坐标。
