---
title: "SAHI 在建筑外立面缺陷检测中的作用"
published: 2026-07-04
updated: 2026-07-14
draft: false
description: "记录 SAHI + YOLOv8 在建筑外立面缺陷检测中的实践价值：切片训练、切片推理、结果合并和重复框处理。"
image: "/blog-assets/sahi-tiling-workflow.svg"
tags: ["SAHI", "YOLOv8", "建筑缺陷检测"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么需要 SAHI

建筑外立面缺陷检测的典型输入是无人机拍摄的大图。图片分辨率高，墙面范围大，但缺陷目标往往很小。直接把整图缩放到 YOLO 输入尺寸后，裂缝、剥落、露筋、泛碱等目标会被压缩，召回率容易下降。

SAHI 的价值在于：它不强迫模型一次看完整张大图，而是把大图切成多个带重叠的小图，让模型在更高有效分辨率下看缺陷，再把检测结果映射回原图坐标。

一句话总结：

> SAHI 解决的是“大图小目标”问题，不是替代 YOLO，而是帮助 YOLO 更合理地观察高分辨率图像。

![SAHI 切片检测流程图](/blog-assets/sahi-tiling-workflow.svg)

> SAHI 工作流示意图：大图被切成重叠小图，检测结果再映射回原图坐标。

## 整体流程

SAHI 推理过程可以拆成四步：

1. 将原始大图按固定尺寸切片。
2. 每个切片单独送入检测模型。
3. 把切片内的局部坐标还原为原图坐标。
4. 对重叠区域的重复框进行合并。

伪代码如下：

```text
function sahiDetect(image, model, sliceSize, overlap):
  allPredictions = []
  slices = createOverlappedSlices(image, sliceSize, overlap)

  for slice in slices:
    localPredictions = model.detect(slice.crop)
    globalPredictions = mapBoxesToOriginalImage(
      localPredictions,
      slice.offsetX,
      slice.offsetY
    )
    allPredictions.append(globalPredictions)

  mergedPredictions = mergeOverlappingBoxes(allPredictions)
  return mergedPredictions
```

实际工程里还需要处理类别阈值、NMS、批量推理、GPU 显存、日志记录和标签保存。

## 切片大小怎么选

切片大小不是越小越好，也不是越大越好。它需要在“缺陷可见性”和“上下文信息”之间平衡。

切片太大：

- 小缺陷依然会被缩小。
- 对显存压力更大。
- 整图背景干扰仍然明显。

切片太小：

- 缺陷细节更清楚。
- 但墙面上下文不足，容易把纹理误判为缺陷。
- 切片数量变多，推理时间增加。

我在项目中更关注的是工程稳定性，而不是盲目追求一个固定参数。一般会结合以下信息调试：

- 原图分辨率。
- 缺陷框平均尺寸。
- 最小缺陷的有效像素。
- GPU 推理耗时。
- 重叠区域重复框数量。
- 漏检和误检样本的分布。

缺图占位：这里后续可以补一张切片大小对比图，例如 640、960、1280 三种切片下同一个缺陷的可见程度。

## 重叠比例为什么重要

如果完全不重叠，缺陷刚好出现在切片边界时可能被截断。对于裂缝、剥落这类形状不规则的目标，边界截断会影响检测框完整性。

因此切片通常需要设置 overlap。

重叠比例过小：

- 边界缺陷容易被切断。
- 召回率可能下降。

重叠比例过大：

- 重复检测框变多。
- 推理时间增加。
- 结果合并压力变大。

工程上要接受一个现实：SAHI 会引入更多候选框，后处理必须做好，否则界面里会出现大量重复缺陷。

## 结果合并

切片检测完成后，同一个缺陷可能在多个切片中被检测到。合并时要关注：

- 框重叠程度。
- 类别是否一致。
- 置信度高低。
- 框是否来自切片边缘。
- 是否跨越切片边界。

常见策略是基于 IoU 或 IOS 做合并，但在建筑缺陷里还要注意细长裂缝目标。裂缝框可能长而窄，IoU 对框位置偏移比较敏感，所以有时需要结合类别、中心距离和面积比例做判断。

```text
function mergeFacadeDefects(predictions):
  groups = []
  for pred in predictions:
    matchedGroup = findGroupByCategoryAndOverlap(groups, pred)
    if matchedGroup exists:
      matchedGroup.add(pred)
    else:
      groups.append(new group(pred))

  return groups.map(selectBestBox)
```

这段伪代码表达的是思想：先按类别和空间关系分组，再选择置信度更高或覆盖更完整的框作为最终结果。

## 和 PyQt 系统如何连接

在我的系统里，SAHI 不只是一个单独脚本，而是作为 FastAPI 检测服务的一部分被 PyQt 客户端调用。

链路大致是：

```text
PyQt 选择图片
  -> FastAPI 接收检测请求
  -> SAHI 切片推理
  -> YOLO 输出切片结果
  -> SAHI 合并并还原到原图坐标
  -> 返回结构化标签
  -> PyQt 保存标签并渲染结果
```

我没有只返回检测后的图片，而是返回结构化标签。这样客户端可以做更多事情：

- 根据类别筛选缺陷。
- 重新渲染不同颜色的检测框。
- 打开 LabelMe 做人工修正。
- 写入 SQLite 统计缺陷数量。
- 后续把检测框映射到三维坐标。

## 常见问题

### 1. 推理速度变慢

SAHI 会把一张大图拆成多张切片，推理次数自然增加。解决方式不是一味减少切片，而是结合任务目标做取舍：

- 对预览模式使用较低精度或较高阈值。
- 对正式检测使用更稳的切片参数。
- 支持批量检测时显示进度和日志。
- 对失败图片单独记录，避免整批任务中断。

### 2. 重复框变多

重复框主要来自切片重叠区域。需要调试合并策略，并在界面中支持人工复核。对于工程系统来说，少量重复框比漏检更容易处理，因为重复框可以通过去重和人工复核消解。

### 3. 误检纹理

外立面纹理、窗框阴影、污渍都可能产生误检。这个问题不能只靠 SAHI 解决，还需要数据集整理、类别统一和现场样本补充。

## 实习项目中的经验

我对 SAHI 的理解不是“用了就一定更准”，而是：

- 它让模型更适合处理大图小目标。
- 它让检测结果能保留原图坐标。
- 它给后续人工复核和三维定位提供了更稳定的输入。
- 它会带来速度和重复框问题，需要工程上继续处理。

如果只是做单张图片 demo，直接整图 YOLO 也许更简单；但在建筑外立面缺陷检测系统里，SAHI 更适合接入完整工程链路。

## 小结

SAHI 在这个项目中的作用可以概括为：

> 通过切片推理解决高分辨率外立面图像中的小缺陷可见性问题，并把检测结果还原为可进入系统流程的原图坐标。

后续的 LabelMe 人工复核、二维三维联动和报告导出，都依赖这个结构化检测结果。
