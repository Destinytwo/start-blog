---
title: "PyInstaller 打包 PyQt + OSG + LabelMe 项目的经验"
published: 2026-06-24
updated: 2026-07-14
draft: false
description: "复盘桌面端发布打包：onedir 结构、外部 bin 目录、OSG DLL、LabelMe 私有运行环境和启动速度优化。"
image: "/blog-assets/packaging-runtime.svg"
tags: ["PyInstaller", "LabelMe", "运行时打包"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么选择 onedir

这篇记录的是外立面缺陷检测桌面系统的打包经验。这个系统是我在武汉市测绘研究院算法实习期间参与的科研项目，桌面端涉及 PyQt、FastAPI、本地 SQLite、OSG/OSGB 查看器、LabelMe 人工修正、YOLO/SAHI 检测和 Word 报告导出。

项目开发阶段能跑起来不代表能交付给别人使用。只要换一台没有 Python 环境、没有配置依赖、没有装开发工具的电脑，很多问题就会集中暴露出来：

- PyQt 插件找不到，界面打不开。
- OSG DLL 缺失，三维模型加载失败。
- LabelMe 依赖环境不一致，人工标注工具启动失败。
- 模型权重、配置文件、字体、图标路径在打包后失效。
- `cv2`、`matplotlib`、`python-docx` 等库让启动速度明显变慢。

因此打包的目标不是“生成一个 exe”，而是生成一个目录结构清楚、依赖完整、出错可排查的发布包。

onefile 打包虽然看起来只有一个 exe，但运行时需要解压，启动慢且依赖排查不方便。对于包含 PyQt、OSG、LabelMe 和多个 DLL 的项目，onedir 更适合工程交付。

我最终更倾向于 onedir，原因很现实：

- 依赖文件都能看到，缺什么一眼能查。
- 外部工具可以单独替换，不用重新打整个 exe。
- 日志、配置和模型权重可以保持文件形态，方便排错。
- 启动时不需要把一大坨资源解压到临时目录。
- 发布包体积虽然看起来更大，但更适合工程现场交付。

## 打包重点

这个项目的难点不是 PyInstaller 本身，而是外部工具链的运行时依赖。

打包时我把主程序、OSG 查看器、LabelMe 私有运行环境、DLL/插件、日志和配置分开组织。这样即使某个外部工具启动失败，也可以通过日志和目录结构快速定位。

发布目录大致可以分成几类：

```text
BuildingDefectSystem/
  BuildingDefectSystem.exe
  app/
    config/
    models/
    templates/
    static/
  bin/
    osgviewer/
    helper_tools/
  runtime/
    labelme_env/
    qt_plugins/
  logs/
  projects/
```

这个结构的核心思想是：主程序只负责调度，外部工具和运行时依赖放在明确位置。

## runtime_paths：打包后的路径统一入口

Python 项目打包后，最容易出问题的是路径。开发阶段使用相对路径可能没问题，但 PyInstaller 打包后，当前工作目录、可执行文件目录和临时解包目录都可能变化。

所以我会封装一个统一的运行时路径函数，而不是在各个模块里到处写 `../models`、`./bin`。

```text
function findRuntimeTool(toolName):
  base = directoryOfCurrentExecutable()
  candidates = [
    base / "bin" / toolName,
    base / "runtime" / toolName,
    developmentFallbackPath(toolName)
  ]
  for path in candidates:
    if exists(path):
      return path
  raise RuntimeError("runtime tool missing")
```

伪代码表达的是路径查找策略，重点是运行时资源如何随程序发布。

这个函数要解决三个环境：

- 开发环境：直接从源码目录运行。
- 打包环境：从 exe 同级目录运行。
- 调试环境：某些工具临时从工作目录启动。

只要入口统一，后面定位模型权重、报告模板、OSG 工具、LabelMe 环境都会简单很多。

## PyQt 打包注意点

PyQt 项目打包后常见问题是平台插件缺失，典型表现是程序启动时报 `Could not load the Qt platform plugin "windows"`。

处理思路是确保 Qt 的 plugins 被正确带进发布目录，尤其是：

- `platforms/qwindows.dll`
- `imageformats`
- `styles`
- 可能用到的 Qt 运行时 DLL

如果界面里还嵌入了三维窗口或外部进程，窗口句柄和进程生命周期也要处理好。打包后路径变了，外部工具启动失败时不能让主界面直接崩溃，而应该给出日志和提示。

![建筑缺陷检测系统主界面](/blog-assets/building-system-home.png)

## OSG/OSGB 查看器依赖

OSG 相关依赖是这个项目里比较典型的打包难点。OSGB 模型不是普通图片，加载时会依赖 OSG 的 DLL、插件、纹理路径和模型入口文件。

如果 OSG 依赖没有放完整，可能出现这些问题：

- 主模型文件能找到，但子瓦片加载失败。
- 模型能打开，但纹理丢失，显示成灰白块。
- 开发机正常，换电脑后提示某个 DLL 缺失。
- 外部 osgviewer 能启动，但嵌入 PyQt 后窗口黑屏。

我更倾向于把 OSG 相关文件放在 `bin/osgviewer/` 下，并在启动前显式拼好运行环境，而不是依赖系统 PATH。这样发布包到新电脑上时，只要目录完整，就不需要用户再手动配置环境变量。

## LabelMe 私有运行环境

系统里集成 LabelMe 的目的，是让检测结果能人工复核和修正。问题在于 LabelMe 本身也有一套依赖，如果直接调用系统里的 Python 或全局 LabelMe，就会遇到版本不一致问题。

更稳的做法是准备一个私有运行环境：

```text
runtime/
  labelme_env/
    python.exe
    Scripts/
    Lib/
    labelme.exe
```

主程序打开人工修正时，只调用这个私有环境里的 LabelMe。这样用户电脑上有没有装 Python、装的是什么版本，都不会影响系统运行。

这块还要注意输入输出路径：

- 传给 LabelMe 的图片路径必须存在。
- LabelMe 输出的 JSON 要能被系统重新读取。
- 人工修正后的类别和框要能覆盖或合并模型结果。
- LabelMe 退出后，主程序要刷新当前照片状态。

## 重库延迟加载

桌面端启动速度会直接影响使用体验。这个项目里有一些库并不是打开主界面就必须加载，比如：

- `cv2`
- `matplotlib`
- `python-docx`
- `PIL`
- 深度学习推理相关库

如果在主入口一次性导入，启动会变慢，甚至用户还没点检测、报告导出，相关库就已经加载了。

因此我会把它们延迟到对应功能里再导入：

```text
function exportReport():
  import docx
  import matplotlib
  ...

function runDetection():
  import cv2
  import inference_backend
  ...
```

这种方式不能减少整体依赖体积，但能改善主界面首次启动体验，也能让错误更集中在具体功能入口。

## 打包前要清理进程

Windows 下打包还有一个很实际的问题：旧程序或外部工具没关，DLL 被占用，复制文件会失败。

尤其是 PyQt 主程序、OSG 查看器、LabelMe 进程、日志文件和 Word 报告文件，如果还在运行或打开，就可能导致打包脚本无法覆盖旧文件。

我的处理习惯是打包前检查：

- 主程序是否已经关闭。
- `osgviewer` 或辅助工具进程是否残留。
- Word 报告模板是否被打开。
- 输出目录是否能删除或覆盖。
- 日志目录是否还被占用。

这里不建议在脚本里粗暴杀所有同名进程，最好先提示，再让用户确认。工程环境里误杀正在使用的进程会带来新的问题。

## 日志和错误定位

发布包到别人电脑上运行时，不能指望对方打开命令行看 traceback。所以日志必须写到发布目录里的固定位置。

我一般会保留两类日志：

```text
logs/
  app.log
  external_tools.log
```

`app.log` 记录主程序流程，比如项目打开、检测启动、报告导出。`external_tools.log` 记录 OSG、LabelMe、辅助工具的启动命令、返回码和错误输出。

一旦用户反馈“模型打不开”或“LabelMe 点了没反应”，可以先看日志判断是路径问题、DLL 问题、权限问题还是外部工具本身异常。

## 发布前检查清单

每次打包后，我会按功能链路做一次最小验收：

- 能否在无开发环境电脑上打开主界面。
- 能否新建或打开项目。
- 能否加载一组照片。
- 能否运行检测并保存结果。
- 能否打开 LabelMe 做人工修正。
- 能否加载 OSGB 三维模型并显示红点。
- 能否生成 Word 报告。
- 关闭程序后是否有残留进程。

这套检查不复杂，但能覆盖大多数“开发机能跑，交付机不能跑”的问题。

## 可视化示意

下面这张图展示的是 onedir 发布目录的依赖组织方式。主程序、外部工具、私有运行环境和日志目录分开，排查问题会更清楚。

![PyInstaller onedir 发布目录结构图](/blog-assets/packaging-runtime.svg)

> 发布目录示意图：主程序、bin、runtime 和日志分开，便于部署和排错。

![发布目录结构示意](/blog-assets/packaging-runtime.svg)

## 复盘

PyInstaller 打包这种工作很容易被低估。对于简单脚本来说，它可能只是一个命令；但对于 PyQt + OSG + LabelMe + 深度学习推理的桌面系统来说，打包本质上是在整理运行时依赖和工程边界。

这部分给我的经验是：越复杂的桌面项目，越不要追求“看起来只有一个文件”。交付时真正重要的是可运行、可排查、可替换、可迁移。onedir 目录虽然不如 onefile 简洁，但更符合这种工程系统的实际需求。
