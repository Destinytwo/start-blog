---
title: "PyInstaller 打包 PyQt + OSG + LabelMe 项目的经验"
published: 2026-06-24
updated: 2026-06-24
draft: false
description: "复盘桌面端发布打包：onedir 结构、外部 bin 目录、OSG DLL、LabelMe 私有运行环境和启动速度优化。"
image: "/blog-assets/packaging-runtime.svg"
tags: ["PyInstaller", "LabelMe", "运行时打包"]
category: "建筑缺陷项目"
author: "Funny"
---

## 为什么选择 onedir

onefile 打包虽然看起来只有一个 exe，但运行时需要解压，启动慢且依赖排查不方便。对于包含 PyQt、OSG、LabelMe 和多个 DLL 的项目，onedir 更适合工程交付。

发布目录中把主程序、外部工具、DLL、插件和私有运行环境分开管理，问题定位会清楚很多。

## 打包重点

这个项目的难点不是 PyInstaller 本身，而是外部工具链的运行时依赖。

打包时我把主程序、OSG 查看器、LabelMe 私有运行环境、DLL/插件、日志和配置分开组织。这样即使某个外部工具启动失败，也可以通过日志和目录结构快速定位。

- 用 runtime_paths 统一查找程序同级 bin 目录
- 将 OSG 查看器和 DLL/插件复制到发布目录
- 为 LabelMe 准备私有运行环境，避免依赖系统环境变量
- 打包前关闭旧程序和外部进程，避免 DLL 被占用导致失败
- 延迟加载 cv2、matplotlib、docx、PIL 等重库，减少启动卡顿

### 发布目录查找运行时的伪代码

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

这篇文章可以帮助读者理解为什么复杂桌面项目更适合 onedir 发布。

![PyInstaller onedir 发布目录结构图](/blog-assets/packaging-runtime.svg)

> 发布目录示意图：主程序、bin、runtime 和日志分开，便于部署和排错。
