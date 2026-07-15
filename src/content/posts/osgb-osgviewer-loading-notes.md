---
title: "OSGB 实景三维模型加载与 OSGViewer 踩坑记录"
published: 2026-06-29
updated: 2026-07-14
draft: false
description: "整理 OSGB 实景三维模型加载过程中的工程问题：瓦片索引、metadata.xml、Qt 嵌入、光照和交互控制。"
image: "/blog-assets/osgb-viewer-main-building.png"
tags: ["OSGB", "OSGViewer", "Qt 嵌入"]
category: "建筑缺陷项目"
author: "Funny"
---

## OSGB 不是一个普通模型文件

这篇记录的是我在武汉市测绘研究院算法实习期间参与的外立面缺陷检测科研项目中的 OSGB 模型加载部分。

在建筑外立面缺陷检测系统中，三维模型使用的是实景三维成果。它通常不是一个单独的 `.obj` 或 `.fbx` 文件，而是一整套 OSGB 瓦片数据。

常见结构包括：

```text
model/
  metadata.xml
  Data/
    Tile_0/
    Tile_1/
    ...
  *.osgb
  textures/
```

如果把它当成普通三维模型加载，很容易遇到：

- 找不到主索引文件。
- 瓦片路径解析失败。
- 纹理丢失。
- 模型加载范围异常。
- 坐标原点和工程坐标不一致。

所以 OSGB 加载的重点不是“读一个文件”，而是识别成果包结构。

![OSGB 模型加载界面截图](/blog-assets/osgb-viewer-main-building.png)

> OSGB 模型加载界面：展示切割后的主要楼栋在三维查看器中的加载效果。

## 为什么要嵌入到 PyQt

这个项目不是做一个独立三维查看器，而是做建筑缺陷检测系统。三维模型只是系统中的一个模块，需要和图片、检测结果、数据库、报告导出联动。

因此三维查看器要嵌入 PyQt 客户端中，支持：

- 显示目标建筑模型。
- 显示缺陷红点。
- 点击模型获得坐标。
- 根据三维点查找候选照片。
- 配合报告和楼层切面。

这比单独打开一个 OSGViewer 要复杂，因为窗口生命周期、渲染循环、Qt 容器和鼠标事件都要处理。

## 加载流程

简化流程如下：

```text
选择项目
  -> 查找 metadata.xml
  -> 识别主 OSGB 或瓦片索引
  -> 启动自定义 OSGViewer
  -> 嵌入 PyQt 三维面板
  -> 读取模型原点和坐标范围
  -> 支持拾取和红点显示
```

### OSGB 加载与嵌入伪代码

```text
function loadRealityModel(project):
  metadata = findMetadata(project.modelDirectory)
  rootTile = detectRootTile(project.modelDirectory)

  viewer = createCustomOsgViewer(rootTile)
  qtWindow = embedViewerIntoQtPanel(viewer)

  origin = readSpatialOrigin(metadata)
  bbox = computeModelBoundingBox(viewer.scene)

  viewer.onPick((localPoint) => {
    worldPoint = localPoint + origin
    showCoordinateInUi(worldPoint)
    searchCandidatePhotos(worldPoint)
  })
```

这段伪代码表达的是系统协作关系：模型加载、Qt 嵌入、坐标显示和照片联动。

## 常见坑一：主入口文件不明确

有些 OSGB 成果包里会有很多 `.osgb` 文件，并不是随便打开一个都能看到完整模型。需要识别主瓦片或索引文件。

工程上可以做几步检查：

- 优先读取 metadata.xml。
- 查找根节点或最上层瓦片。
- 检查 Data 目录结构。
- 尝试加载后判断模型包围盒是否合理。

如果主入口选错，可能只加载到局部瓦片，或者什么都看不到。

## 常见坑二：纹理路径丢失

OSGB 成果通常依赖相对路径。如果模型目录被移动，或者打包时只复制了 `.osgb` 文件，没有复制纹理目录，就会出现模型灰白、黑块或纹理缺失。

因此发布时要保证：

- OSGB 文件和纹理目录保持相对路径。
- 不单独复制某个瓦片。
- 项目打开时校验纹理目录是否存在。

实际处理时，我会把模型目录整体迁移，并在加载前检查 Data、Tile、Texture 等路径是否完整。

## 常见坑三：SRSOrigin 和坐标偏移

实景三维模型常常会使用局部坐标，同时用 SRSOrigin 保存空间原点。如果展示只用局部坐标没问题，但做二维三维联动时必须恢复到工程坐标。

否则会出现：

- 三维拾取点坐标不对。
- 检测框投影到模型时偏移。
- 红点显示在错误位置。
- 楼层切面范围不准确。

我在系统中会显式记录：

```text
worldPoint = localPoint + SRSOrigin
localPoint = worldPoint - SRSOrigin
```

不要把这一步藏在复杂公式里，否则后续很难排查。

## 常见坑四：Qt 嵌入和窗口生命周期

OSGViewer 直接嵌入 PyQt 时，要注意：

- 三维窗口句柄何时创建。
- Qt 容器销毁时 OSG 资源是否释放。
- 多次打开项目是否重复创建 viewer。
- 鼠标事件是否被 Qt 拦截。
- 渲染循环是否影响主界面。

我的处理原则是：三维模块独立封装，PyQt 只负责放置和调用，不把 viewer 生命周期散落到多个界面类里。

## 交互体验调整

三维模型在巡检系统里的交互和普通三维浏览器不一样。用户不是要做复杂建模，而是要快速查看建筑和缺陷点位。

所以需要做一些体验调整：

- 关闭不合适的惯性旋转。
- 设置合理初始视角。
- 优化缩放速度。
- 调整光照，避免模型过暗。
- 支持红点点击和坐标显示。
- 限制过度复杂的操作入口。

## 小结

OSGB 加载看似只是系统里的一个模块，但它影响后续很多能力：

- 三维模型展示。
- 坐标拾取。
- 二维三维联动。
- 缺陷红点显示。
- 楼层切面和报告。

这部分的核心经验是：

> 不要把 OSGB 当成一个普通三维文件处理，要把它当成带瓦片、纹理、坐标原点和工程语义的实景三维成果包。

只有模型加载和坐标链路稳定，后续缺陷定位才可信。
