---
title: "测绘程序设计：曲线拟合的边界补点、切向量估计和三次参数曲线"
published: 2024-07-22
updated: 2024-07-22
draft: false
description: "曲线拟合模块的工程实现：点文件读取、闭合/不闭合曲线补点、切向量估计、三次参数曲线系数计算、曲线采样和 MFC 展示。"
image: "/blog-assets/surveying-curve-fitting-result.png"
tags: ["测绘程序设计", "曲线拟合", "C++", "MFC", "参数曲线", "Hermite"]
category: "测绘竞赛项目"
author: "Funny"
---

## 模块概述

曲线拟合模块用于将离散平面点拟合成连续平滑曲线。程序读取点名、`x` 坐标和 `y` 坐标，按闭合或不闭合曲线分别处理边界点，计算各点切向方向，并生成分段三次参数曲线系数。

![曲线拟合结果](/blog-assets/surveying-curve-fitting-result.png)

MFC 主界面包含读取数据、计算和报告菜单：

![曲线拟合 MFC 界面](/blog-assets/surveying-curve-mfc-ui.png)

整体流程如下：

```text
读取 CSV 点文件
  -> 解析点名、x、y
  -> 判断闭合 / 不闭合曲线
  -> 补充边界辅助点
  -> 计算节点切向量
  -> 生成三次参数曲线系数
  -> 按 t 采样曲线点
  -> 绘制曲线并输出报告
```

## 工程入口

主对话框菜单事件负责读取数据和触发计算：

```cpp
void CQXNHDlg::OnFileOpen()
{
    CFileDialog CFile(true);

    if (CFile.DoModal() == IDOK) {
        CString path = CFile.GetPathName();
        cal.Read(path);
        isRead = true;
    }
}

void CQXNHDlg::OnCal_close()
{
    cal.Close();
}

void CQXNHDlg::OnCal_unClose()
{
    cal.unClose();
}
```

核心计算集中在 `Calculate` 类中，界面层只负责文件选择和命令调度。

## 数据结构

点和曲线段结构定义如下：

```cpp
struct Point {
    string id;
    double x, y;
    double cosi, sini;
};

struct Quxian {
    Point start, end;
    double E0, E1, E2, E3;
    double F0, F1, F2, F3;
    double r;
};
```

其中：

- `cosi/sini` 表示节点处单位切向量。
- `E0~E3` 是 `X(t)` 的三次曲线系数。
- `F0~F3` 是 `Y(t)` 的三次曲线系数。
- `r` 是相邻节点间距离。

曲线段表达式：

```text
X(t) = E0 + E1*t + E2*t^2 + E3*t^3
Y(t) = F0 + F1*t + F2*t^2 + F3*t^3
0 <= t <= 1
```

## 点文件读取

输入文件采用逗号分隔：

```text
P1,0,0
P2,80,42
P3,160,28
P4,240,96
P5,330,80
P6,420,140
```

读取代码如下：

```cpp
void Calculate::Read(CString path)
{
    ifstream ifs(path);
    string str, temp;

    while (!ifs.eof()) {
        Point p;
        getline(ifs, str);

        stringstream ss(str);
        vector<string> data;

        while (getline(ss, temp, ',')) {
            data.push_back(temp);
        }

        p.id = data[0];
        p.x = stod(data[1]);
        p.y = stod(data[2]);
        readPoint.push_back(p);
    }
}
```

读取完成后，原始点存放在 `readPoint` 中，后续补点和拟合计算使用 `point` 与 `qu` 两个容器。

## 闭合曲线补点

闭合曲线首尾相接，首点前方可以使用尾部点作为辅助点，尾点后方可以使用开头点作为辅助点。

```cpp
void Calculate::Add(bool is_close)
{
    int len = readPoint.size();

    if (is_close) {
        point.push_back(readPoint[len - 2]);
        point.push_back(readPoint[len - 1]);

        for (int i = 0; i < len; i++) {
            point.push_back(readPoint[i]);
        }

        point.push_back(readPoint[0]);
        point.push_back(readPoint[1]);
        point.push_back(readPoint[2]);
    }
}
```

补点后，每个真实节点的前后都拥有足够邻点，可用于估计切向方向。

## 不闭合曲线补点

不闭合曲线首尾不相接，需要在两端构造虚拟控制点。程序使用首端前三点和末端后三点推算辅助点：

```cpp
Point A, B;
Point p1, p2, p3;

p1 = readPoint[0];
p2 = readPoint[1];
p3 = readPoint[2];

A.id = "A";
B.id = "B";

A.x = p3.x - 3 * p2.x + 3 * p1.x;
A.y = p3.y - 3 * p2.y - 3 * p1.y;
B.x = p2.x - 3 * p1.x + 3 * A.x;
B.y = p2.y - 3 * p1.y + 3 * A.y;

point.push_back(B);
point.push_back(A);

for (int i = 0; i < len; i++) {
    point.push_back(readPoint[i]);
}
```

末端同样生成 `C/D` 两个辅助点：

```cpp
Point C, D;
p3 = readPoint[len - 3];
p2 = readPoint[len - 2];
p1 = readPoint[len - 1];

C.id = "C";
D.id = "D";

C.x = p3.x - 3 * p2.x + 3 * p1.x;
C.y = p3.y - 3 * p2.y + 3 * p1.y;
D.x = p2.x - 3 * p1.x + 3 * C.x;
D.y = p2.y - 3 * p1.y + 3 * C.y;

point.push_back(C);
point.push_back(D);
```

闭合和不闭合曲线的区别集中在边界处理，后续切向量和曲线系数计算可以共用。

## 切向量估计

节点切向量由前后相邻折线段加权计算。程序先求四段局部向量：

```cpp
a1 = point[i - 1].x - point[i - 2].x;
b1 = point[i - 1].y - point[i - 2].y;
a2 = point[i].x - point[i - 1].x;
b2 = point[i].y - point[i - 1].y;
a3 = point[i + 1].x - point[i].x;
b3 = point[i + 1].y - point[i].y;
a4 = point[i + 2].x - point[i + 1].x;
b4 = point[i + 2].y - point[i + 1].y;
```

然后使用叉积绝对值构造权重：

```cpp
w2 = abs(a3 * b4 - a4 * b3);
w3 = abs(a1 * b2 - a2 * b1);

a0 = w2 * a2 + w3 * a3;
b0 = w2 * b2 + w3 * b3;

point[i].cosi = a0 / sqrt(a0 * a0 + b0 * b0);
point[i].sini = b0 / sqrt(a0 * a0 + b0 * b0);
```

完整函数如下：

```cpp
void Calculate::Get_TiDu()
{
    for (int i = 2; i < point.size() - 2; i++) {
        a1 = point[i - 1].x - point[i - 2].x;
        b1 = point[i - 1].y - point[i - 2].y;
        a2 = point[i].x - point[i - 1].x;
        b2 = point[i].y - point[i - 1].y;
        a3 = point[i + 1].x - point[i].x;
        b3 = point[i + 1].y - point[i].y;
        a4 = point[i + 2].x - point[i + 1].x;
        b4 = point[i + 2].y - point[i + 1].y;

        w2 = abs(a3 * b4 - a4 * b3);
        w3 = abs(a1 * b2 - a2 * b1);
        a0 = w2 * a2 + w3 * a3;
        b0 = w2 * b2 + w3 * b3;

        point[i].cosi = a0 / sqrt(a0 * a0 + b0 * b0);
        point[i].sini = b0 / sqrt(a0 * a0 + b0 * b0);
    }
}
```

切向量控制曲线在节点处的进入方向和离开方向，直接影响拟合曲线的平滑程度。

## 三次曲线系数

相邻两个节点生成一段三次参数曲线：

```cpp
void Calculate::Get_Quxian()
{
    for (int i = 2; i < point.size() - 3; i++) {
        Quxian q;
        Point p1 = point[i];
        Point p2 = point[i + 1];

        q.start = p1;
        q.end = p2;
        q.r = Distance(p1, p2);

        q.E0 = p1.x;
        q.E1 = q.r * p1.cosi;
        q.E2 = 3.0 * (p2.x - p1.x)
            - q.r * (p2.cosi + 2 * p1.cosi);
        q.E3 = -2.0 * (p2.x - p1.x)
            + q.r * (p1.cosi + p2.cosi);

        q.F0 = p1.y;
        q.F1 = q.r * p1.sini;
        q.F2 = 3 * (p2.y - p1.y)
            - q.r * (p2.sini + 2 * p1.sini);
        q.F3 = -2 * (p2.y - p1.y)
            + q.r * (p1.sini + p2.sini);

        qu.push_back(q);
    }
}
```

生成的 `qu` 数组就是最终曲线模型。每一段都包含起点、终点、长度和三次多项式系数。

## 曲线采样

绘图前按参数 `t` 对每段曲线采样：

```cpp
Point Sample(const Quxian& q, double t)
{
    Point p;
    p.x = q.E0 + q.E1 * t + q.E2 * t * t + q.E3 * t * t * t;
    p.y = q.F0 + q.F1 * t + q.F2 * t * t + q.F3 * t * t * t;
    return p;
}

vector<Point> SampleCurve(const vector<Quxian>& curves)
{
    vector<Point> result;

    for (const auto& q : curves)
    {
        for (int i = 0; i <= 20; ++i)
        {
            double t = i / 20.0;
            result.push_back(Sample(q, t));
        }
    }

    return result;
}
```

采样点用于图形绘制、结果检查和报告输出。

## 绘图坐标转换

测量坐标需要映射到窗口坐标：

```cpp
int screenX = margin + int((x - minX) * scale);
int screenY = viewHeight - margin - int((y - minY) * scale);
```

`screenY` 使用反向计算，因为 Windows 窗口坐标系的 `y` 轴向下。

## 计算报告

曲线拟合报告包含原始点数量、曲线类型、每段起止点和系数：

```text
曲线拟合计算报告
数据点数：6
曲线类型：不闭合曲线

第 1 段：P1 -> P2
X(t)=E0+E1*t+E2*t^2+E3*t^3
Y(t)=F0+F1*t+F2*t^2+F3*t^3

第 2 段：P2 -> P3
...
```

报告输出的重点是曲线系数。只保存采样点会丢失曲线模型，保存 `E/F` 系数可以完整还原每一段曲线。

## 实现要点

曲线拟合模块的核心在于：

1. 闭合曲线和不闭合曲线使用不同边界补点方式。
2. 节点切向量由相邻折线段加权得到。
3. 每两个相邻节点生成一段三次参数曲线。
4. 曲线绘制通过参数采样完成。
5. 报告输出保留曲线段系数，便于复核和复现。

该模块把离散测量点转换为连续曲线成果，是测绘程序设计中典型的几何建模和桌面图形展示结合模块。
