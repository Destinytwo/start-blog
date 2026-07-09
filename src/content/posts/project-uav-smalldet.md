---
title: "UAV-SmallDet：无人机小目标感知网络"
published: 2025-10-23
updated: 2025-10-23
draft: false
description: "面向无人机航拍场景的小目标检测算法项目，围绕特征稀疏、尺度退化和定位敏感问题设计小目标感知增强框架。"
image: "/blog-assets/smalldet-qualitative-scenes.svg"
tags: ["RT-DETR", "HG-PKINet", "STFL-Neck", "SA-NWD", "VisDrone2019", "Tiny-Person", "LaTeX"]
category: "SmallDet"
author: "Funny"
---

## 项目概览

面向无人机航拍场景的小目标检测算法项目，围绕特征稀疏、尺度退化和定位敏感问题设计小目标感知增强框架。

项目阶段：已整理

实验结果：在 VisDrone2019 上达到 46.0% mAP@0.5，在 Tiny-Person 上达到 21.2% mAP@0.5

- 设计 HG-PKINet 多尺度特征增强模块，提高小目标细粒度纹理捕获能力
- 引入 STFL-Neck 融合浅层高分辨率特征，增强极小目标的局部响应
- 提出 SA-NWD 回归损失，将形状先验与归一化 Wasserstein 距离结合以提升定位鲁棒性

![UAV-SmallDet 小目标检测可视化结果](/blog-assets/smalldet-qualitative-scenes.svg)

> UAV-SmallDet：无人机小目标感知网络

## 项目背景

无人机航拍图像具有视角变化大、目标尺寸小、背景复杂和遮挡密集等特点。常规检测器在这类场景中容易出现漏检、误检和定位漂移，尤其是目标像素占比很低时，深层特征会进一步削弱小目标信息。

这个项目围绕 UAV 小目标检测展开，目标是构建一个兼顾检测精度、特征表达和服务端实时推理适用性的检测框架。

从工程视角看，SmallDet 不只是论文方法，也能服务建筑缺陷检测项目。建筑外立面缺陷在大图中同样具有小目标、弱纹理、背景干扰强的问题，因此 SmallDet 中关于高分辨率浅层特征、定位损失和消融实验的经验可以迁移到工程项目里。

我希望这个项目在网站里承担两个角色：一方面展示算法研究能力，包括问题建模、模块设计、实验验证和论文写作；另一方面展示面向工程落地的判断，比如高分辨率输入、部署成本、可视化解释和失败样例复盘。

![SmallDet 网络结构图](/blog-assets/smalldet-overall-architecture.webp)

> SmallDet 整体结构图：用于说明骨干增强、Neck 融合和损失优化之间的关系。

## 方法设计

UAV-SmallDet 从特征提取、特征融合和回归优化三个环节增强小目标感知能力。骨干部分引入 HG-PKINet，通过多尺度异构卷积核增强细粒度纹理和上下文建模；颈部结构引入 STFL-Neck，把浅层 P2 高分辨率特征纳入融合路径，保留小目标空间细节。

在定位优化上，项目提出 SA-NWD 损失，把目标形状先验与归一化 Wasserstein 距离结合，用更平滑的分布度量缓解小目标框对微小偏移过于敏感的问题。

三个模块分别对应小目标检测中的三个痛点：看不清、融合弱、框不稳。HG-PKINet 负责让骨干网络在不同尺度上看见目标；STFL-Neck 负责把浅层细节带回融合路径；SA-NWD 负责让小框回归不被少量像素偏移过度惩罚。

这三个部分不是孤立堆叠。骨干增强让输入到 Neck 的特征更可靠，P2 高分辨率分支让小目标空间位置不至于过早丢失，SA-NWD 则在训练目标上降低小框回归的敏感性。换句话说，它们分别从特征来源、特征融合和监督信号三个位置改善小目标检测。

### SmallDet 前向流程伪代码

```text
function forward(image):
  features = HG_PKI_Backbone(image)
  shallow = select_high_resolution_feature(features)
  fused = STFL_Neck(features, shallow)
  predictions = detection_head(fused)
  loss = classification_loss(predictions)
       + box_loss_with_SA_NWD(predictions)
  return predictions, loss
```

伪代码只表达模块关系，便于理解网络前向流程。

写博客时可以围绕每个模块回答一个问题：它解决什么现象、放在网络哪里、消融实验怎么验证。

![HG-PKINet 模块结构图](/blog-assets/smalldet-hgpkinet-module.svg)

> HG-PKINet 关注骨干特征增强，通过多尺度感受野提升小目标细节和上下文表达。

![STFL-Neck P2 融合结构图](/blog-assets/smalldet-p2-stfl-neck.svg)

> STFL-Neck 关注特征融合路径，把 P2 高分辨率特征接入小目标检测流程。

![SA-NWD 损失函数示意图](/blog-assets/smalldet-sa-nwd-loss.svg)

> SA-NWD 关注回归监督信号，用分布距离和形状约束缓解小目标框对像素偏移过于敏感的问题。

## 三个创新点如何串联

如果把小目标检测流程拆开，首先要让模型“看见”目标，其次要让不同尺度的特征“汇合”，最后要让训练目标对小框更友好。HG-PKINet、STFL-Neck 和 SA-NWD 正好对应这三个阶段。

HG-PKINet 解决的是特征提取阶段的尺度问题。它通过多尺度分支补充不同感受野，让远距离目标不完全依赖单一卷积尺度。STFL-Neck 解决的是特征融合阶段的细节丢失问题，让浅层高分辨率信息回到检测路径。SA-NWD 解决的是回归优化阶段的指标敏感问题，让小框训练不被轻微偏移过度惩罚。

项目页里这样组织内容，读者可以很快看到论文方法的主线：不是为了创新而创新，而是从小目标检测的实际痛点出发，一个模块解决一个明确问题。

- 特征提取：让小目标在骨干网络中保留足够响应
- 特征融合：让浅层细节和深层语义在 Neck 中有效汇合
- 回归优化：让小框定位损失更平滑、更适合极小目标
- 实验验证：用标准数据集、消融实验和可视化结果逐层证明贡献

### 消融实验组织伪代码

```text
function runAblation(baseModel):
  experiments = [
    baseModel,
    baseModel + HG_PKI_Backbone,
    baseModel + HG_PKI_Backbone + STFL_Neck,
    baseModel + HG_PKI_Backbone + STFL_Neck + SA_NWD
  ]

  for model in experiments:
    train with same public dataset split
    evaluate mAP, recall, precision, speed
    save qualitative results without private paths

  compare each added module with previous setting
```

这段伪代码用于说明消融实验的公平性：控制数据划分、训练设置和评估指标。

实验记录重点展示指标、可视化结果和消融结论。

## 实验结果

实验在 VisDrone2019 和 Tiny-Person 数据集上验证。结果显示，该方法相对基础实时检测框架在两个数据集上分别带来 4.5% 和 2.5% 的 mAP@0.5 提升。

在 VisDrone2019 验证集上，方法达到 46.0% mAP@0.5、28.4% mAP@0.5:0.95、60.6% Precision 和 44.4% Recall；在 Tiny-Person 上达到 21.2% mAP@0.5，体现出对极小目标的敏感性。

结果页要重点展示对比和消融，而不是堆训练日志。比如基础模型、加入 HG-PKINet、加入 STFL-Neck、加入 SA-NWD 后的指标变化，可以让读者快速理解每个模块是否真正有贡献。

可视化结果也很重要。定量指标说明整体有效，定性图则能说明方法在哪些场景更有效：密集车辆、远距离行人、遮挡目标、复杂背景中的小目标，这些都比单独给一张指标表更有说服力。

- 主结果表：展示不同方法在标准数据集上的指标对比
- 消融实验表：单独观察每个创新点带来的提升
- 可视化结果：展示密集小目标、遮挡目标和远距离目标的检测差异
- 失败样例：整理漏检、误检和定位偏移，说明方法仍有边界

![SmallDet 不同场景检测效果图](/blog-assets/smalldet-qualitative-scenes.svg)

> 不同场景检测效果图：用于展示密集小目标、远距离目标和复杂背景下的定性检测结果。

![SmallDet 热力图可视化](/blog-assets/smalldet-heatmap-visualization.svg)

> 热力图可视化：用于观察模型增强后是否更关注小目标区域，而不是只依赖最终指标。

## 与建筑缺陷项目的关系

SmallDet 虽然是论文算法项目，但它和建筑缺陷检测系统之间有明显的技术连续性。建筑外立面的裂缝、剥落、露筋、泛碱等缺陷，在大分辨率航拍图中同样属于小目标或弱纹理目标。模型如果直接把整图缩放到固定输入尺寸，很多细节会被压缩掉。

因此，SmallDet 中关于浅层高分辨率特征、多尺度感受野和小框回归损失的经验，可以迁移到工程项目的模型选择和训练策略里。比如做 SAHI 切片时，需要考虑切片尺度和小目标大小；做模型可视化时，需要判断网络是否真的关注缺陷区域；做报告输出时，需要评估检测框位置是否足够稳定。

这也是我希望网站呈现的个人定位：不是单独做一个论文算法，也不是单独做一个桌面系统，而是把计算机视觉研究和工程系统结合起来，形成可以持续迭代的技术资产。

- 论文算法提供小目标检测方法积累
- 工程项目提供现场场景中的数据、部署和交互问题
- 两类项目共同支撑接单方向：无人机巡检、视觉检测、三维可视化和报告系统

## 项目收获

这个项目更偏论文算法研究，让我系统梳理了无人机小目标检测中的多尺度特征、浅层高分辨率特征复用、回归损失设计和消融实验组织。它也为建筑外立面缺陷检测系统中的航拍小目标检测部分提供了方法积累。

在个人网站里，这个项目可以承担两个作用：一是证明自己有算法研究能力，能够提出模块并做实验验证；二是和建筑缺陷项目形成呼应，说明工程项目不是单纯套模型，而是有小目标检测研究基础。

我把 SmallDet 拆成多篇论文笔记：HG-PKINet、STFL-Neck、SA-NWD、LaTeX 写作、实验表格组织和可视化复盘。项目页讲主线，博客负责把每个细节展开，这样网站内容更像一个持续积累的技术档案，而不是一次性项目简介。

项目展示重点放在标准数据集结果、结构图、可视化和方法复盘上，避免把页面变成训练日志堆叠。
