---
title: "Word 检测报告自动生成：缺陷明细、统计图和楼层切面"
published: 2026-06-25
updated: 2026-06-25
draft: false
description: "整理项目报告导出模块：汇总项目信息、照片信息、缺陷明细、统计图表和楼层切面图。"
image: "/blog-assets/report-flow.svg"
tags: ["Word 报告", "python-docx", "报告导出"]
category: "建筑缺陷项目"
author: "Funny"
---

## 报告是系统闭环的一部分

检测系统不能只停在界面展示，最后还要能把结果交付成报告。报告里需要有缺陷列表、类别统计、照片链接、楼层切面和必要的说明。

导出过程放到后台线程执行，可以避免主界面在生成报告时长时间卡顿。

## 踩过的坑

Word 报告生成看似简单，实际会遇到中文字体、图片体积、表格格式和资源路径管理问题。

如果直接把所有原图和切面图嵌入 Word，文件会迅速变大，也不利于替换和归档。因此更适合把大图片作为外部资产管理，在报告中放可点击链接或压缩后的预览。

- 统一中文字体，避免打开后文字显示为方格
- 原图和切面图使用外部链接，减少报告文件体积
- 缺陷明细按楼层从低到高排序，方便复查
- 报告文档和图片资产目录分开管理，便于迁移

### 报告生成线程伪代码

```text
function startReportExport(project):
  worker = createBackgroundWorker()
  worker.run(() => {
    defects = loadUniqueDefects(project.database)
    stats = computeCategoryStats(defects)
    sectionImages = buildFloorSectionImages(defects)
    doc = createDocumentWithChineseFont()
    doc.addSummary(project.publicInfo)
    doc.addStats(stats)
    doc.addDefectTable(defects)
    doc.addLinks(sectionImages, originalPhotos)
    doc.save(project.reportDirectory)
  })
  worker.onFinish(showSuccessMessage)
  worker.onError(showExportLog)
```

后台线程是为了避免报告导出时主界面卡死。

这里重点说明字体、图片和链接策略如何影响报告生成质量。

![Word 报告生成流程图](/blog-assets/report-flow.svg)

> 报告导出流程：从唯一缺陷、统计和楼层切面，汇总为可交付的 Word 文档。

![报告导出界面截图](/blog-assets/report-export-ui.png)

> 报告导出界面：展示系统将缺陷明细、统计信息和切面图汇总为报告的入口。
