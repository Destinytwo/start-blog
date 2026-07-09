---
title: "写 UAV-SmallDet 论文时的 LaTeX 使用记录"
published: 2025-11-28
updated: 2025-11-28
draft: false
description: "记录 SmallDet 论文写作中用到的 LaTeX 表格、公式、图片、引用和实验结果排版经验。"
image: "/blog-assets/smalldet-overall-architecture.webp"
tags: ["LaTeX", "论文写作", "排版"]
category: "SmallDet"
author: "Funny"
---

## 论文工程化

LaTeX 写论文不只是排版工具，也是一套论文工程管理方式。对于 UAV-SmallDet 这种包含网络结构图、模块图、损失函数公式、主结果表、消融实验表和多组可视化结果的论文，如果所有内容都堆在一个文件里，后期修改会非常痛苦。

我更倾向于把论文拆成几个层次：主文件负责导言区、宏包和章节引用；sections 目录放正文；figures 目录放结构图和结果图；tables 目录放主结果和消融表；refs.bib 单独维护参考文献。这样做的好处是每次修改都有明确位置，也方便在写作后期统一检查图表编号、引用和格式。

这篇博客整理一套可复用的论文写作习惯。写论文或技术报告时，也可以直接沿用这套组织方式。

### 论文项目目录管理伪代码

```text
paper/
  main.tex
  macros.tex
  sections/
    introduction.tex
    related_work.tex
    method.tex
    experiments.tex
    conclusion.tex
  figures/
    network_overview.pdf
    module_hgpkinet.pdf
    qualitative_results.pdf
  tables/
    main_results.tex
    ablation_results.tex
  refs.bib
```

这不是实际论文目录，只是用于说明论文工程组织方式的示例。

目录树示例突出论文工程组织方式，而不是具体文件来源。

## 图表如何管理

SmallDet 论文中最常处理的是网络结构图、消融实验表、数据集结果表、损失函数公式和参考文献格式。图表管理的核心不是把图片插进去，而是让图片、标题、正文引用和实验结论保持一致。

网络结构图适合放在方法章节开头，用来给读者建立整体框架；HG-PKINet、STFL-Neck、SA-NWD 这种模块图适合放在对应小节附近；不同场景检测效果图适合放在实验章节，用来支撑定性分析。每张图都应该回答一个问题，而不是只起装饰作用。

表格也一样。主结果表负责和已有方法对比，消融实验表负责证明每个创新点有效，复杂度表负责说明参数量、推理速度和部署成本。写作时最好先确定表格想说明什么，再决定列哪些指标。

- 表格使用统一列宽和指标命名
- 公式编号要和正文解释保持一致
- 图片文件名尽量表达清楚模块和实验含义
- BibTeX 条目需要提前清理会议名、大小写和页码
- 每张图只服务一个核心结论，避免一张图承担过多解释任务
- 图表文件使用英文短名，便于跨系统编译和版本管理

![SmallDet 网络结构图排版示例](/blog-assets/smalldet-overall-architecture.webp)

> 网络结构图适合放在方法章节开头，用来解释整体框架、模块位置和数据流。

![SmallDet 定性结果图排版示例](/blog-assets/smalldet-qualitative-scenes.svg)

> 定性结果图适合放在实验章节，用来说明方法在不同场景下的检测表现。

## 图片和表格引用模板

写论文时，图片引用最容易出现三个问题：图片太大导致页面溢出，标题写得像文件名，正文引用和图号不一致。我的习惯是先给每张图一个语义明确的 label，比如 fig:overall-framework、fig:hgpkinet-module、fig:qualitative-results，再在正文中用引用命令调用。

表格部分则建议把每个表格单独放在 tables 目录。这样主文件会更干净，修改列宽、加粗最优结果、补充消融项时也更容易定位。

### 图片与表格引用伪代码

```text
In Section Method:
  describe why the module is needed
  reference Figure fig:overall-framework
  explain each branch in the figure

Figure block:
  begin figure
    include sanitized network_overview.pdf
    caption explains method idea, not file name
    label fig:overall-framework
  end figure

Table block:
  input tables/ablation_results
  caption states what comparison proves
  label tab:ablation
```

这里使用类 LaTeX 伪代码，只表达组织方式。

caption 应该解释图表结论，而不是重复图片文件名。

## 公式和损失函数写作

SA-NWD 这类损失函数写作时，最怕只给公式不给解释。读者需要先知道为什么普通 IoU 对小目标不稳定，再看到 NWD 如何把框转换成分布距离，最后理解 shape-aware 项为什么要加入形状约束。

公式排版上，我会把复杂公式拆成几步：先定义预测框和真实框，再定义分布转换，再定义距离度量，最后给出总损失。这样正文和公式能一一对应，读者不会被一整行复杂公式直接拦住。

- 先解释现象，再给数学定义
- 公式编号只给正文会引用的重要公式
- 变量命名要和图示、伪代码保持一致
- 损失函数组合项要在正文里说明各自作用

### 损失函数说明写作伪代码

```text
function writeLossSection():
  introduce IoU sensitivity on tiny boxes
  define predicted box and target box
  convert boxes into distributions
  define normalized distance term
  add shape-aware regularization term
  explain how the loss is used during training
```

论文写作里的伪代码强调叙述顺序，帮助把损失函数从现象、定义到训练使用讲完整。

公式细节和实验配置在正文中保持和论文叙述一致。

![SA-NWD 损失函数图示](/blog-assets/smalldet-sa-nwd-loss.svg)

> 损失函数图示适合配合公式讲解，帮助读者理解小目标框偏移、分布距离和形状约束之间的关系。

## 写作整理

LaTeX 文章也可以写得工程化：不是只贴命令，而是讲清楚论文目录怎么拆、图表怎么命名、消融表怎么维护、参考文献怎么清理、编译失败怎么定位。

常用表格模板、图片引用、BibTeX 清理规则、双栏图排版、长表格处理和编译错误定位都按主题整理。这样不仅服务 SmallDet 论文，也能服务建筑缺陷项目报告、技术方案文档和投稿论文。

LaTeX 相关示例使用重绘目录树、示例表格和结构图，重点展示写作组织方式。

![HG-PKINet 模块图排版示例](/blog-assets/smalldet-hgpkinet-module.svg)

> 模块图适合放在方法章节对应小节附近，正文围绕输入、分支、融合和输出逐步解释。
