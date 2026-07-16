---
title: "测绘程序设计：大地线长度计算的椭球参数、迭代反算和 MFC 工程实现"
published: 2024-07-20
updated: 2024-07-20
draft: false
description: "大地线长度计算模块的工程实现：DMS 角度解析、参考椭球选择、辅助纬度、经差迭代、距离级数改正、MFC 表格显示和报告导出。"
image: "/blog-assets/surveying-geodesic-result.png"
tags: ["测绘程序设计", "大地线", "C++", "MFC", "椭球参数", "大地测量"]
category: "测绘竞赛项目"
author: "Funny"
---

## 模块概述

大地线长度计算模块用于完成椭球面两点反算。程序输入两个点的大地坐标 `B/L`，选择参考椭球参数后，计算两点之间的大地线长 `S`，并将结果输出到表格和报告窗口。

![大地线长度计算结果](/blog-assets/surveying-geodesic-result.png)

程序采用 Visual Studio / MFC 桌面工程结构，主界面包含点坐标表、结果表和菜单命令。

![大地线长度 MFC 界面](/blog-assets/surveying-geodesic-mfc-ui.png)

整体流程如下：

```text
读取 txt 坐标文件
  -> 解析 dd.mmss 格式纬经度
  -> 选择参考椭球参数
  -> 计算辅助纬度 u
  -> 迭代修正经差 lambda
  -> 计算大地方位角和球面弧长
  -> 进行椭球级数改正
  -> 得到大地线长 S
  -> 表格显示并生成报告
```

## 输入数据格式

坐标文件按行读取，每行包含一个点的纬度 `B` 和经度 `L`，中间使用空格分隔：

```text
30.304512 114.213418
31.132655 121.284826
```

程序读取逻辑如下：

```cpp
bool ProcessData::OpenData(CString str)
{
    ifstream ifs;
    ifs.open(str, ios::in);

    if (ifs.is_open())
    {
        string buf1, buf2;
        while (getline(ifs, buf1))
        {
            stringstream ss(buf1);

            if (getline(ss, buf1, ' ') && getline(ss, buf2, ' '))
            {
                double b = stod(buf1);
                double l = stod(buf2);
                p.push_back({ b, l });
            }
        }
    }
    else
    {
        return false;
    }

    ifs.close();
    return true;
}
```

读取后的点存入 `vector<Point_m> p`，界面通过 `CListCtrl` 将 `P1/P2` 的 `B(dd.mmss)` 和 `L(dd.mmss)` 显示出来。

## 角度解析

大地坐标采用 `dd.mmss` 形式录入，不能直接作为十进制度参与三角函数运算。程序先把 `dd.mmss` 拆成度、分、秒，再转为弧度：

```cpp
double ProcessData::DegToRad(double x)
{
    double deg = (int)x;
    double min = (int)((x - deg) * 100);
    double sec = x * 10000 - deg * 10000 - min * 100;

    double rad = (deg + min / 60.0 + sec / 3600.0)
        / 180.0 * Pi;

    return rad;
}
```

计算完成后，角度结果可通过反向函数转回 `dd.mmss`：

```cpp
double ProcessData::RadToDeg(double rad)
{
    double degree = rad * 180.0 / Pi;
    double deg = trunc(degree);
    double min = trunc((degree - deg) * 60);
    double sec = ((degree - deg) * 60 - min) * 60;

    sec = round(sec * 10000) / 10000;
    return deg + min / 100 + sec / 10000;
}
```

角度格式转换是大地线计算的前置条件。输入单位错误会直接导致距离、方位角和迭代改正全部失真。

## 参考椭球参数

程序菜单提供三套参考椭球：

| 椭球 | 长半轴 `a` | 第一偏心率平方 `e2` | 第二偏心率平方 `e_2` |
| --- | ---: | ---: | ---: |
| 克拉索夫斯基椭球 | 6378245 | 0.00669342162297 | 0.00673852541468 |
| IUGG1975 椭球 | 6378140 | 0.00669438499959 | 0.00673950181947 |
| CGC2000 椭球 | 6378137 | 0.00669438002290 | 0.00673949677548 |

CGC2000 参数切换代码如下：

```cpp
void CDDXCD1Dlg::On_4()
{
    choice = 3;

    GetMenu()->CheckMenuItem(ID_32780, MF_CHECKED | MF_BYCOMMAND);
    GetMenu()->CheckMenuItem(ID_32777, MF_UNCHECKED | MF_BYCOMMAND);
    GetMenu()->CheckMenuItem(ID_32776, MF_UNCHECKED | MF_BYCOMMAND);

    pro.e2 = 0.00669438002290;
    pro.e_2 = 0.00673949677548;
    pro.a = 6378137;

    double b2 = pow(pro.a, 2) * (1 - pro.e2);
    pro.b = sqrt(b2);
}
```

椭球短半轴通过 `b = sqrt(a^2 * (1 - e2))` 计算，后续距离级数改正依赖该参数。

## 辅助纬度

大地线反算先将大地纬度 `B` 转换为辅助纬度 `u`：

```cpp
double ProcessData::Calculatiion_u(double x)
{
    double t = sqrt(1 - e2);
    double u = atan(t * tan(x));
    return u;
}
```

辅助计算函数负责统一准备 `u1/u2/l/a1/a2/b1/b2`：

```cpp
void ProcessData::Auxiliary_calculation(
    double& u1, double& u2, double& l,
    double& a1, double& a2, double& b1, double& b2)
{
    double rad_B1 = DegToRad(p[0].m_B);
    double rad_B2 = DegToRad(p[1].m_B);

    u1 = Calculatiion_u(rad_B1);
    u2 = Calculatiion_u(rad_B2);
    l = p[1].m_L - p[0].m_L;
    labuta = l;

    a1 = sin(u1) * sin(u2);
    a2 = cos(u1) * cos(u2);
    b1 = cos(u1) * sin(u2);
    b2 = sin(u1) * cos(u2);
}
```

这一步把输入坐标转换成大地线迭代所需的基础量。

## 方位角和球面弧长

给定当前经差 `lambda` 后，可以计算辅助量 `p/q`，再反算起点大地方位角 `A1` 和球面弧长 `sigma`：

```cpp
void ProcessData::Calculation_A1_xigema(
    double labuta,
    double& A1,
    double& xigema)
{
    double rad_labuta = DegToRad(labuta);
    double p = cos(u2) * sin(rad_labuta);
    double q = b1 - b2 * cos(rad_labuta);

    A1 = atan(p / q);
    A1 = RadToDeg(A1);

    if (p > 0 && q > 0) A1 = abs(A1);
    else if (p > 0 && q < 0) A1 = 180 - abs(A1);
    else if (p < 0 && q < 0) A1 = 180 + abs(A1);
    else if (p < 0 && q > 0) A1 = 360 - abs(A1);

    double rad_A1 = DegToRad(A1);
    double sinx = p * sin(rad_A1) + q * cos(rad_A1);
    double cosx = a1 + a2 * cos(labuta);

    double x = atan2(sinx, cosx);
    double deg_x = RadToDeg(x);

    if (cosx > 0) deg_x = abs(deg_x);
    else deg_x = 180 - abs(deg_x);

    xigema = deg_x;
}
```

象限判断用于保证方位角落在正确范围内。

## 经差迭代

椭球面大地线反算需要迭代修正经差。程序先计算 `delta`，再更新 `lambda`，直到两次改正值差小于阈值 `esp`：

```cpp
void ProcessData::Calculation_angle(
    double& labuta,
    double& A1,
    double& xigema,
    double& sinA0)
{
    while (1)
    {
        Calculation_A1_xigema(labuta, A1, xigema);
        Calculation_deerta_sinA0(deerta, sinA0, A1, xigema);
        labuta = l + deerta;

        if (abs(predeerta - deerta) < esp)
            break;
        else
            predeerta = deerta;
    }
}
```

其中 `Calculation_deerta_sinA0` 根据方位角、球面弧长和椭球偏心率计算经差改正：

```cpp
void ProcessData::Calculation_deerta_sinA0(
    double& deerta,
    double& sinA0,
    double A1,
    double xigema)
{
    double rad_A1 = DegToRad(A1);
    sinA0 = cos(u1) * sin(rad_A1);

    double cos2A0 = 1 - pow(sinA0, 2);
    xigema1 = atan(tan(u1) / cos(rad_A1));

    double aerfa, beita, gama;
    double rad_xigema = DegToRad(xigema);

    Get_aerfa_beta_gama(aerfa, beita, gama, cos2A0);

    deerta = (
        aerfa * xigema
        + beita * cos(2 * xigema1 + rad_xigema) * sin(rad_xigema)
        + gama * sin(2 * rad_xigema)
            * cos(4 * xigema1 + 2 * rad_xigema)
    ) * sinA0;
}
```

## 距离级数改正

迭代收敛后，程序计算 `A/B/C` 系数并得到大地线长：

```cpp
void ProcessData::Get_ABC(double& A, double& B, double& C)
{
    double cos2A0 = 1 - pow(sinA0, 2);
    double k2 = e_2 * cos2A0;
    double k4 = pow(k2, 2);
    double k6 = pow(k2, 3);

    A = (1 - k2 / 4 + 7 * k4 / 64 - 15 * k6 / 256) / b;
    B = (k4 / 4 - k4 / 8 + 37 * k6 / 512);
    C = (k4 / 128 - k6 / 128);
}

void ProcessData::Calculation_S(double& S)
{
    double A, B, C;
    Get_ABC(A, B, C);

    double rad_xigema = DegToRad(xigema);
    double X_s = C * sin(2 * rad_xigema)
        * cos(4 * xigema1 + 2 * rad_xigema);

    S = (
        xigema
        - B * sin(rad_xigema) * cos(2 * xigema1 + rad_xigema)
        - X_s
    ) / A;
}
```

该部分体现了大地线长度与平面距离的区别：距离结果来自椭球参数、方位角、球面弧长和级数改正的综合计算。

## MFC 事件串联

计算菜单事件负责校验数据、调用算法并刷新界面：

```cpp
void CDDXCD1Dlg::On_Calculate()
{
    if (!isData)
    {
        MessageBox("无数据，请添加数据");
        return;
    }

    isCal = true;

    pro.Auxiliary_calculation(
        pro.u1, pro.u2, pro.l,
        pro.a1, pro.a2, pro.b1, pro.b2);

    pro.Calculation_A1_xigema(pro.labuta, pro.A1, pro.xigema);
    pro.Calculation_deerta_sinA0(
        pro.deerta, pro.sinA0, pro.A1, pro.xigema);
    pro.Calculation_angle(
        pro.labuta, pro.A1, pro.xigema, pro.sinA0);
    pro.Calculation_S(pro.S);

    CString strValue;
    strValue.Format(_T("%lf"), pro.S);
    m_list2.SetItemText(0, 1, strValue);
}
```

界面层只做数据校验、算法调度和结果显示，核心计算集中在 `ProcessData` 类中。

## 报告生成

报告窗口输出椭球名称、两点坐标和大地线长度：

```cpp
str += _T("----------------------结果-------------------");
str += "\r\n";
str += _T("大地线长（m）：");
str1.Format(_T("%lf"), pro.S);
str += str1;
```

另存为功能通过 `CStdioFile` 写入文本文件：

```cpp
if (TmpDlg.DoModal() == IDOK)
{
    m_strTmpFile = TmpDlg.GetPathName();

    if (!cfLogFile.Open(
        m_strTmpFile,
        CFile::modeCreate | CFile::modeWrite | CFile::modeNoTruncate,
        NULL))
    {
        return;
    }

    cfLogFile.WriteString(strDlg);
    cfLogFile.Close();
}
```

至此，大地线长度模块形成了完整闭环：数据读取、椭球选择、迭代计算、结果显示和成果保存。
