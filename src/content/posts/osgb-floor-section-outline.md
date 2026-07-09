---
title: "OSGB 楼层横切面图生成思路"
published: 2026-06-26
updated: 2026-06-26
draft: false
description: "记录楼层切面图的方案选择：放弃当前视角截图和栅格化轮廓，改为按楼层高度生成水平横切面。"
image: "/blog-assets/report-flow.svg"
tags: ["OSGB", "楼层切面", "报告可视化"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么需要楼层切面

缺陷红点落到三维模型后，还需要在报告里给出更容易阅读的楼层级视图。直接放三维截图不够稳定，视角变化会影响读者判断。

楼层横切面可以把每层范围、缺陷点位置和坐标标注放到统一平面上，更适合报告和复查。

## 方案选择

项目中明确采用水平楼层切面，从上往下查看建筑轮廓，并把楼层范围限定在缺陷最低点到最高点之间。

这个方案比直接使用当前视角截图更稳定，因为报告读者不需要理解三维视角和透视关系，只要看到某一层的轮廓和缺陷点位置即可。

- 导出场景包围盒，确定切面高度范围
- 按楼层批量请求横切面轮廓数据
- 修正 OSGB 局部坐标到工程坐标的转换
- 在切面图上叠加缺陷点、坐标轴和坐标标注

### 楼层切面生成伪代码

```text
function generateFloorSections(model, markers):
  minZ, maxZ = verticalRange(markers)
  floors = splitRangeByFloorHeight(minZ, maxZ)
  for floor in floors:
    plane = horizontalPlane(z=floor.centerHeight)
    outline = intersectModelWithPlane(model, plane)
    floorMarkers = filter markers inside floor range
    image = drawOutlineWithMarkers(outline, floorMarkers)
    save image into report assets
```

伪代码只表达横切面思路。工程实现中会涉及 OSGB 局部坐标、工程坐标转换和轮廓导出工具。

楼层切面图用于解释切面生成、轮廓提取和缺陷点投影之间的关系。

![楼层切面进入报告的流程图](/blog-assets/report-flow.svg)

> 楼层切面不是单独的图片功能，它最终服务于缺陷报告和楼层级复查。

![楼层切面图](/blog-assets/floor-section-report.png)

> 楼层切面图：在报告中用平面轮廓和缺陷点展示楼层范围内的缺陷分布。
