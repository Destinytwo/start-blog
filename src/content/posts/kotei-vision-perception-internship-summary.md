---
title: "自动驾驶视觉感知算法实习总结：从点云语义建图到 APA/MPA 指标"
published: 2025-08-30
updated: 2025-08-30
draft: false
description: "整理自动驾驶视觉感知算法实习中的 AVM、点云语义建图、APA/MPA 指标计算、PCL 预处理和 CloudCompare 可视化工作。"
tags: ["视觉感知", "光庭", "AVM", "语义建图", "APA", "MPA", "PCL", "点云", "实习总结"]
category: "视觉算法项目"
author: "Funny"
---

## 写在前面

本文整理自动驾驶视觉感知算法实习中的技术内容，时间范围是 2025.03 到 2025.08。

这部分和后面的车载终端测试开发是两条不同线：这里更偏智能驾驶视觉感知算法，主要围绕 AVM 全景环视、语义分割、点云语义建图、APA/MPA 指标计算和三维点云映射。

内容聚焦可归档的技术方向、工作拆解和工程要点。

## 一、实习内容概览

从结果上看，主要分为两类工作：

| 方向 | 关注内容 | 产出价值 |
| --- | --- | --- |
| AVM 全景环视 | 亚像素级角点检测、特征点匹配、拼接质量优化 | 提高环视图像拼接精度和稳定性 |
| 语义建图 | PCD 预处理、语义分割、APA/MPA 指标、点云映射与可视化 | 让二维语义结果能稳定落到三维空间里 |

这两块表面上一个是图像拼接，一个是三维建图，但底层都在处理同一个问题：二维图像里的信息，怎么稳定、准确地转换成后续模块能用的几何结果。

## 二、AVM：亚像素角点检测为什么重要

AVM 全景环视不是简单把几张相机图像拼在一起。环视图像能不能拼得自然，前面角点检测和特征匹配的精度很关键。

其中一部分工作围绕亚像素级角点检测做算法开发和效果优化。普通像素级角点能给出大致位置，但在拼接场景里，几个像素的误差就可能带来明显接缝、错位或者局部拉伸。

处理这类问题时，重点看三件事：

1. 角点位置是否稳定。
2. 特征点匹配是否容易误配。
3. 优化后全景图像的接缝和畸变是否减少。

这类工作体现了“算法精度”和“视觉效果”之间的关系。指标提升是一方面，更重要的是最终拼接出来的图像能不能支撑后续泊车和感知任务。

## 三、语义建图：从 PCD 到三维点云

另一条主线是语义数据建图。

报告里重点补充了几件事：

- PCD 文件格式的头信息、字段和存储结构。
- 如何用 PCL 做点云读取、滤波和体素下采样。
- 如何把二维语义分割结果和三维点云对齐。
- 如何借助 CloudCompare 做三维重建和交互查看。

这部分主要用到：

- C++
- PCL 点云库
- CloudCompare
- PointNet / PointNet++
- 语义分割结果
- 三维点云可视化与质量评估

映射后的点云需要重点检查是否存在明显错位、类别混乱、稀疏区域异常等问题。CloudCompare 在这类工作里很有用，因为它能直观看到点云结构、局部噪声和映射效果。

## 四、APA / MPA：指标不是为了好看，是为了判断模型是否真能用

这份资料中比较关键的一块，是 APA 和 MPA 的计算与可视化。

按当时的整理方式，APA 更偏整体像素级准确率，MPA 则是对各类别单独准确率再取均值。它们的价值在于能把“模型看起来差不多”变成“到底哪一类更稳、哪一类更容易掉”。

通常先构建混淆矩阵，再把结果算出来：

```python
import numpy as np
from sklearn.metrics import confusion_matrix

def calc_apa_mpa(y_true, y_pred, class_ids):
    cm = confusion_matrix(y_true, y_pred, labels=class_ids)
    total = cm.sum()
    apa = np.trace(cm) / total if total else 0.0

    per_class = np.diag(cm) / np.clip(cm.sum(axis=1), 1, None)
    mpa = per_class.mean() if len(per_class) else 0.0
    return apa, mpa, cm
```

然后再把训练轮次里的变化画出来：

```python
import matplotlib.pyplot as plt

def plot_metrics(history):
    plt.figure(figsize=(8, 4))
    plt.plot(history["apa"], label="APA")
    plt.plot(history["mpa"], label="MPA")
    plt.xlabel("epoch")
    plt.ylabel("score")
    plt.legend()
    plt.tight_layout()
    plt.show()
```

这一步的意义不是“会算指标”，而是能判断模型是不是在往正确方向走。只看单次结果很容易误判，指标曲线才能更稳定地反映模型收敛情况。

## 五、两张结果图：可视化证据

这两张图分别对应阈值处理和对比度增强后的效果。它们更像是预处理和可视化的中间证据，不是最终结论，但适合说明排查和对比结果的方式。

![阈值处理结果](/blog-assets/kotei-semantic-threshold.png)

![对比度增强结果](/blog-assets/kotei-semantic-contrast.png)

图里重点关注三个点：

1. 预处理后边界是否更清晰。
2. 目标区域和背景的分离是否更稳定。
3. 后续做语义建图时，点云映射能否更容易看出结构差异。

## 六、代码拆解：工程处理链路

智能驾驶里的视觉算法不能只看单个模型或单张图片效果。它最后要进入一条连续链路：

```text
图像采集 -> 图像预处理 -> 特征/语义提取 -> 几何映射 -> 指标统计 -> 点云分析 -> 上层模块使用
```

其中任何一层不稳，都会传到后面。

比如角点检测稍微偏一点，AVM 拼接就会受影响；语义结果映射到点云时坐标不准，APA 后续建图和路径规划也会被干扰。所以这类工作不能只停在“算法跑通”，还要持续看结果能不能在工程链路里稳定使用。

### 1. PCD 读取和体素下采样

报告里先把 PCD 文件的读写、滤波和下采样流程理顺。工程上最常见的需求不是“直接喂给模型”，而是先把原始点云清洗到可用状态。

```cpp
pcl::PointCloud<pcl::PointXYZ>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZ>);
pcl::PointCloud<pcl::PointXYZ>::Ptr filtered(new pcl::PointCloud<pcl::PointXYZ>);

if (pcl::io::loadPCDFile<pcl::PointXYZ>(pcd_path, *cloud) == -1) {
    throw std::runtime_error("load pcd failed");
}

pcl::VoxelGrid<pcl::PointXYZ> voxel;
voxel.setInputCloud(cloud);
voxel.setLeafSize(0.05f, 0.05f, 0.05f);
voxel.filter(*filtered);
```

### 2. 点云结果和三维场景对齐

如果坐标系不统一，后面的语义建图和结果分析都会失真。因此需要先把世界坐标、相机坐标和点云坐标理顺，再做映射。

```cpp
Eigen::Matrix4f T = Eigen::Matrix4f::Identity();
// 这里根据外参填充旋转和平移
// T(0, 3) = tx; T(1, 3) = ty; T(2, 3) = tz;

for (const auto& pt : cloud->points) {
    Eigen::Vector4f p(pt.x, pt.y, pt.z, 1.0f);
    Eigen::Vector4f q = T * p;
    // 用 q 做后续映射或可视化
}
```

### 3. 用图表把结论固定下来

APA / MPA 曲线和类别结果需要固定成图，而不是只看一遍终端输出。这一步很重要，因为图一旦稳定，后续分析就能直接使用。

```python
import matplotlib.pyplot as plt

def plot_confusion(cm):
    plt.figure(figsize=(5.5, 4.5))
    plt.imshow(cm, cmap="Blues")
    plt.colorbar()
    plt.xlabel("pred")
    plt.ylabel("true")
    plt.tight_layout()
    plt.show()
```

## 七、能力沉淀

这部分工作把计算机视觉、点云处理、三维几何和 C++ 工程开发接到了智能驾驶场景里。

比较明显的能力沉淀包括：

- 更熟悉 AVM、APA 这类智能驾驶视觉感知模块的工作方式。
- 对亚像素角点检测、特征匹配和图像拼接质量有了实际判断经验。
- 能用 C++、PCL 和 CloudCompare 把二维结果往三维空间里落。
- 通过 APA / MPA 和混淆矩阵，能更稳地判断语义分割结果是否可用。
- 更清楚视觉算法在真实工程链路里为什么要关注稳定性、坐标一致性和结果可解释性。

## 八、非技术部分：工程协作

报告里还有一部分内容属于工程协作：技术之外的东西同样会影响项目推进。

- 团队协作要及时沟通，不能各做各的。
- 版本控制和任务拆分要清楚，后面才好追溯。
- 资源和时间调度要有成本意识，不然计算和调试会被无效消耗拖慢。
- 对数据、代码和引用要保持边界感，别把“能跑”当成“能直接用”。
- 遇到 CMake、PCL 兼容这类问题，先看官方文档和日志，再找社区方案，不要盲试。

这部分看起来偏软，但它决定了一个项目最后是不是能稳定交付。

## 九、小结

这部分内容补上的是“智能驾驶视觉感知”和“三维空间表达”这一块。后续无人机建筑缺陷检测、二维照片和三维模型联动中，也可以复用类似的空间映射思路。

它不只是一次实习记录，更像是“二维视觉结果”进入“三维工程链路”的一套技术归档。
