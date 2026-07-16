---
title: "测绘程序设计：纵横断面计算的数据链路、里程投影和剖面图生成"
published: 2024-07-21
updated: 2024-07-21
draft: false
description: "纵横断面计算模块的工程实现：中心线累计里程、地形点投影、纵断面高程曲线、横断面偏距曲线、MFC 表格展示和报告输出。"
image: "/blog-assets/surveying-profile-section-result.png"
tags: ["测绘程序设计", "纵横断面", "C++", "MFC", "GIS", "剖面图"]
category: "测绘竞赛项目"
author: "Funny"
---

## 模块概述

纵横断面计算模块用于将中心线点、地形点和高程数据组织成可计算的断面成果。程序完成中心线累计里程计算、地形点投影、纵断面曲线生成和指定桩号横断面提取，并通过 MFC 表格与剖面图输出结果。

![纵横断面计算结果](/blog-assets/surveying-profile-section-result.png)

程序界面采用 `CListCtrl` 显示点名、坐标和计算结果：

![纵横断面 MFC 界面](/blog-assets/surveying-section-mfc-ui.png)

整体流程如下：

```text
读取中心线点和地形点
  -> 检查点名、坐标、高程字段
  -> 计算中心线累计里程
  -> 将地形点投影到中心线
  -> 生成 station / offset / elevation
  -> 按 station 排序生成纵断面
  -> 按目标桩号筛选横断面
  -> 绘制里程-高程图和偏距-高程图
  -> 输出计算表和报告
```

## 界面初始化

主界面表格使用整行选中和网格线样式，便于检查输入点数据：

```cpp
BOOL Dlg_Main::OnInitDialog()
{
    CDialog::OnInitDialog();

    m_list.SetExtendedStyle(
        m_list.GetExtendedStyle()
        | LVS_EX_FULLROWSELECT
        | LVS_EX_GRIDLINES);

    m_list.InsertColumn(0, _T("点名"), 0, 150);
    m_list.InsertColumn(1, _T("x坐标"), 0, 250);
    m_list.InsertColumn(2, _T("y坐标"), 0, 250);

    return TRUE;
}
```

断面计算对数据顺序和字段完整性要求较高，表格显示可以快速发现空值、坐标列错位、点名重复等问题。

## 数据结构

纵横断面模块包含两类点：

- 中心线点：用于形成路线折线和累计里程。
- 地形点：用于投影到中心线并形成断面点。

核心结构体如下：

```cpp
struct SurveyPoint
{
    CString name;
    double x = 0.0;
    double y = 0.0;
    double h = 0.0;
};

struct SectionPoint
{
    CString name;
    double station = 0.0;
    double offset = 0.0;
    double h = 0.0;
};
```

字段含义：

| 字段 | 含义 |
| --- | --- |
| `station` | 点在中心线上的投影里程 |
| `offset` | 点相对中心线的左右偏距 |
| `h` | 高程 |

`station` 用于纵断面排序，`offset` 用于横断面排序。

## 中心线累计里程

中心线由多个折线点组成。程序先逐段计算相邻中心线点之间的距离，再累加得到每个节点的里程。

```cpp
double Distance(const SurveyPoint& p1, const SurveyPoint& p2)
{
    double dx = p2.x - p1.x;
    double dy = p2.y - p1.y;
    return sqrt(dx * dx + dy * dy);
}

vector<double> BuildStation(const vector<SurveyPoint>& centerLine)
{
    vector<double> station(centerLine.size(), 0.0);

    for (int i = 1; i < centerLine.size(); ++i)
    {
        station[i] = station[i - 1]
            + Distance(centerLine[i - 1], centerLine[i]);
    }

    return station;
}
```

累计里程是纵断面横坐标，也是横断面提取时的桩号基准。

## 点到线段投影

对每个地形点，程序遍历中心线每一段，计算点到线段的投影位置。设线段起点为 `A`，终点为 `B`，地形点为 `P`。

```cpp
SectionPoint ProjectToSegment(
    const SurveyPoint& p,
    const SurveyPoint& a,
    const SurveyPoint& b,
    double stationA)
{
    double vx = b.x - a.x;
    double vy = b.y - a.y;
    double wx = p.x - a.x;
    double wy = p.y - a.y;

    double len2 = vx * vx + vy * vy;
    double t = (wx * vx + wy * vy) / len2;

    if (t < 0.0) t = 0.0;
    if (t > 1.0) t = 1.0;

    double segLen = sqrt(len2);
    double cross = vx * (p.y - a.y) - vy * (p.x - a.x);

    SectionPoint result;
    result.name = p.name;
    result.station = stationA + t * segLen;
    result.offset = cross / segLen;
    result.h = p.h;

    return result;
}
```

`t` 表示投影点在线段上的比例位置，取值范围限制在 `[0, 1]`。`offset` 由叉积除以线段长度得到，可以保留左右方向。

## 最佳投影段选择

中心线包含多段折线时，需要为每个地形点选择最近的投影段：

```cpp
SectionPoint ProjectToCenterLine(
    const SurveyPoint& p,
    const vector<SurveyPoint>& centerLine,
    const vector<double>& station)
{
    SectionPoint best;
    double minDistance = DBL_MAX;

    for (int i = 0; i + 1 < centerLine.size(); ++i)
    {
        SectionPoint cur = ProjectToSegment(
            p,
            centerLine[i],
            centerLine[i + 1],
            station[i]);

        double distance = fabs(cur.offset);
        if (distance < minDistance)
        {
            minDistance = distance;
            best = cur;
        }
    }

    return best;
}
```

处理后，每个地形点都会得到统一的断面坐标：

```text
点名 + station + offset + h
```

这组数据是纵断面和横断面共用的中间成果。

## 纵断面生成

纵断面按里程 `station` 排序，形成“里程-高程”曲线：

```cpp
vector<SectionPoint> BuildLongitudinalProfile(
    vector<SectionPoint> sectionPoints)
{
    sort(
        sectionPoints.begin(),
        sectionPoints.end(),
        [](const SectionPoint& a, const SectionPoint& b)
        {
            return a.station < b.station;
        });

    return sectionPoints;
}
```

纵断面输出表包含：

| 点名 | 里程 `station` | 偏距 `offset` | 高程 `h` |
| --- | ---: | ---: | ---: |
| P01 | 0.000 | 0.000 | 35.000 |
| P02 | 50.000 | -2.500 | 36.120 |

绘制时使用 `station` 作为横坐标，`h` 作为纵坐标。

## 横断面生成

横断面按目标桩号筛选断面点。例如要提取 `K0+500`，可以设置容差窗口，将指定里程附近的点归入同一横断面。

```cpp
vector<SectionPoint> BuildCrossSection(
    const vector<SectionPoint>& points,
    double targetStation,
    double tolerance)
{
    vector<SectionPoint> result;

    for (const auto& p : points)
    {
        if (fabs(p.station - targetStation) <= tolerance)
        {
            result.push_back(p);
        }
    }

    sort(
        result.begin(),
        result.end(),
        [](const SectionPoint& a, const SectionPoint& b)
        {
            return a.offset < b.offset;
        });

    return result;
}
```

横断面绘制时使用 `offset` 作为横坐标，`h` 作为纵坐标。左侧偏距和右侧偏距通过正负号区分。

## 坐标到屏幕的映射

剖面图绘制前，需要将测量坐标映射到窗口坐标：

```cpp
CPoint ToScreen(
    double x,
    double y,
    double minX,
    double minY,
    double scale,
    int margin,
    int viewHeight)
{
    int sx = margin + int((x - minX) * scale);
    int sy = viewHeight - margin - int((y - minY) * scale);
    return CPoint(sx, sy);
}
```

屏幕坐标的 `y` 轴向下，因此高程坐标映射时要使用 `viewHeight - margin - ...`。

## 剖面图绘制

折线绘制逻辑如下：

```cpp
void DrawProfile(CDC* pDC, const vector<CPoint>& points)
{
    if (points.size() < 2) return;

    CPen pen(PS_SOLID, 2, RGB(37, 99, 235));
    CPen* oldPen = pDC->SelectObject(&pen);

    pDC->MoveTo(points[0]);
    for (int i = 1; i < points.size(); ++i)
    {
        pDC->LineTo(points[i]);
    }

    pDC->SelectObject(oldPen);
}
```

纵断面和横断面共用绘图函数，只需要切换横轴数据：

- 纵断面：`x = station`，`y = h`
- 横断面：`x = offset`，`y = h`

## 报告输出

报告内容包含数据摘要、目标桩号、纵断面点表和横断面点表：

```cpp
CString BuildSectionReport(
    const vector<SectionPoint>& longitudinal,
    const vector<SectionPoint>& cross)
{
    CString report;
    report += _T("纵横断面计算报告\r\n");
    report += _T("--------------------------------\r\n");

    report += _T("纵断面点数：");
    CString value;
    value.Format(_T("%d\r\n"), (int)longitudinal.size());
    report += value;

    report += _T("横断面点数：");
    value.Format(_T("%d\r\n"), (int)cross.size());
    report += value;

    return report;
}
```

报告和表格共同提供结果复核依据。表格便于检查每个点，报告便于保存最终成果。

## 实现要点

纵横断面模块的关键点集中在四个位置：

1. 中心线必须先计算累计里程。
2. 地形点要投影到中心线，而不是只计算点距。
3. 纵断面按 `station` 排序，横断面按 `offset` 排序。
4. 绘图前必须完成测量坐标到屏幕坐标的比例变换。

该模块承担的是测绘数据的空间组织和成果表达工作，最终输出包括计算表、纵断面图、横断面图和文本报告。
