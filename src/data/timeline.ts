import type { TimelineItem } from "../components/features/timeline/types";

export const timelineData: TimelineItem[] = [
	{
		id: "wuhan-surveying-algorithm-intern",
		title: "武汉市测绘研究院算法实习",
		description:
			"围绕建筑外立面巡检与三维测绘数据应用场景，参与建筑缺陷检测系统科研项目，把无人机航拍影像、实景三维模型、目标检测、人工复核和报告导出串成完整系统原型。",
		type: "internship",
		startDate: "2026-03-01",
		endDate: "2026-07-31",
		location: "武汉",
		organization: "武汉市测绘研究院",
		position: "算法实习生",
		skills: ["Python", "PyQt5", "FastAPI", "SAHI", "Ultralytics", "OSGB", "SQLite"],
		projects: [
			{
				name: "基于实景三维模型的建筑物缺陷检测系统",
				summary:
					"完成项目管理、三维模型加载、二维影像检测、缺陷空间定位、LabelMe 修正和 Word 报告导出。",
				url: "/posts/project-building-defect-3d-system/",
			},
			{
				name: "二维缺陷框到三维模型红点映射",
				summary:
					"结合空三参数和模型坐标转换，将二维检测结果映射到三维空间，并处理多照片重复缺陷合并。",
				url: "/posts/defect-2d-to-3d-red-marker/",
			},
		],
		achievements: [
			"把算法实验推进到可交互、可复核、可导出报告的工程闭环。",
			"沉淀了 PyQt 客户端、FastAPI 推理服务、OSGB 可视化和文档生成经验。",
		],
		icon: "material-symbols:domain-rounded",
		color: "#16A34A",
		featured: true,
	},
	{
		id: "entest-test-dev-intern",
		title: "智能网联车载系统测试开发实习",
		description:
			"参与百度 Apollo RT6、RT7 车载终端在台架环境下的功能与稳定性验证，围绕上电、休眠唤醒、CAN 通信、网络恢复和异常场景编写测试用例与自动化脚本。",
		type: "internship",
		startDate: "2025-09-01",
		endDate: "2026-02-28",
		location: "武汉",
		organization: "武汉英泰斯特电子技术有限公司",
		position: "测试开发实习生",
		skills: ["Python", "CAN", "PCAN", "SSH", "自动化测试", "车载终端"],
		projects: [
			{
				name: "百度 RT6 休眠唤醒与外网连通性自动化测试",
				summary:
					"基于串口日志识别 sleepAck 休眠状态，通过 PCAN 发送 NM 唤醒报文，并自动完成 Wi-Fi 连接、SSH 登录和外网 ping 验证。",
			},
			{
				name: "RT6 / RT7 台架点检与异常场景用例",
				summary:
					"梳理终端上电、网络通信、系统运行状态等核心链路，参与用例评审并补充可执行的功能与异常测试场景。",
			},
		],
		achievements: [
			"将重复人工点检链路沉淀为可复用脚本，提高测试执行稳定性。",
			"熟悉智能网联车载终端的通信、休眠唤醒和台架验证流程。",
		],
		icon: "material-symbols:directions-car-rounded",
		color: "#0F766E",
		featured: true,
	},
	{
		id: "kotei-vision-algorithm-intern",
		title: "视觉感知算法实习",
		description:
			"参与 AVM 全景环视与 APA 自动泊车相关研发，负责角点检测精度优化、二维语义结果到三维点云的映射验证，以及点云质量分析。",
		type: "internship",
		startDate: "2025-03-01",
		endDate: "2025-08-31",
		location: "武汉",
		organization: "武汉光庭技术股份有限公司",
		position: "视觉感知算法实习生",
		skills: ["C++", "PCL", "CloudCompare", "语义分割", "三维重建", "AVM"],
		projects: [
			{
				name: "AVM 亚像素级角点检测优化",
				summary:
					"优化特征点匹配精度，提升全景环视图像拼接质量，并通过对比测试验证角点稳定性。",
			},
			{
				name: "语义分割结果到三维点云映射",
				summary:
					"使用 C++ 与 PCL 将二维语义图像映射到三维点云，并结合 CloudCompare 做可视化分析与质量评估。",
			},
		],
		achievements: [
			"把视觉检测、三维点云和自动泊车环境建图链路串联起来。",
			"积累了车载感知算法工程化验证经验。",
		],
		icon: "material-symbols:camera-video-rounded",
		color: "#2563EB",
		featured: true,
	},
	{
		id: "uav-smalldet-lab",
		title: "无人机小目标检测研究",
		description:
			"围绕无人机航拍场景中的小目标检测问题，基于 RT-DETR 设计特征增强、多尺度融合和定位损失优化方案，并整理为论文与实验笔记。",
		type: "lab",
		startDate: "2024-08-01",
		endDate: "2025-08-31",
		location: "武汉",
		organization: "本科生导师实验室",
		position: "算法研究",
		skills: ["RT-DETR", "PyTorch", "小目标检测", "Transformer", "消融实验"],
		projects: [
			{
				name: "UAV-SmallDet：无人机小目标感知网络",
				summary:
					"面向特征稀疏、尺度退化和定位敏感问题，设计小目标感知增强框架。",
				url: "/posts/project-uav-smalldet/",
			},
			{
				name: "HG-PKINet / STFL-Neck / SA-NWD 创新点整理",
				summary:
					"分别从多尺度骨干、高分辨率浅层特征融合和小目标框回归稳定性三个方向做实验复盘。",
				url: "/posts/smalldet-innovation-hgpkinet/",
			},
		],
		achievements: [
			"相较基线模型在精度和速度上取得阶段性提升。",
			"完成小目标检测论文写作与实验结果整理，论文处于投稿/审稿阶段。",
		],
		icon: "material-symbols:drone-rounded",
		color: "#7C3AED",
		featured: true,
	},
	{
		id: "surveying-gis-competition",
		title: "测绘程序设计竞赛经历",
		description:
			"独立完成 GIS 方向纵横断面计算与绘制程序，从数据解析、算法计算、图形渲染到结果导出形成完整桌面软件流程。",
		type: "competition",
		startDate: "2023-09-01",
		endDate: "2024-07-31",
		location: "武汉",
		organization: "测绘学科创新创业智能大赛",
		position: "程序设计参赛项目",
		skills: ["C++", "MFC", "GIS", "数据校验", "图形绘制"],
		projects: [
			{
				name: "基于 MFC 的纵横断面计算与绘制程序",
				summary:
					"实现断面数据输入解析、异常数据校验、纵横断面高程计算、曲线绘制和参数报告导出。",
			},
		],
		achievements: ["获得全国二等奖。", "强化了桌面软件工程、数据结构设计和 GIS 数据处理能力。"],
		icon: "material-symbols:map-rounded",
		color: "#D97706",
		featured: true,
	},
	{
		id: "robot-competition-season",
		title: "机器人算法竞赛经历",
		description:
			"以队长身份推进机器人竞赛项目，负责算法方案、软件架构、仿真测试和团队协作，覆盖视觉引导、路径规划、状态机控制等方向。",
		type: "competition",
		startDate: "2023-09-01",
		endDate: "2024-10-31",
		location: "武汉",
		organization: "机器人竞赛团队",
		position: "队长 / 算法负责人",
		skills: ["C++", "OpenCV", "MFC", "Jetson Nano", "A*", "状态机"],
		projects: [
			{
				name: "仿生四足机器人视觉引导竞速系统",
				summary:
					"基于 OpenCV 完成灰度化、阈值分割、边缘提取和中线拟合，部署在 Jetson Nano 上实现低延迟路径识别。",
			},
			{
				name: "机器人足球算法系统",
				summary:
					"基于 MFC 构建可视化控制与仿真界面，设计路径规划、碰撞检测、安全距离约束和策略调整逻辑。",
			},
		],
		achievements: [
			"Robocon 仿生四足机器人竞速赛全国三等奖。",
			"RoboCup 中国赛 FIRA 仿真 5v5 全国一等奖、11v11 全国三等奖。",
		],
		icon: "material-symbols:smart-toy-rounded",
		color: "#DC2626",
		featured: true,
	},
	{
		id: "programming-foundation-competitions",
		title: "编程与算法竞赛积累",
		description:
			"从 C++ 程序设计、算法实现和工程调试入手，逐步积累数据结构、复杂逻辑拆解和代码质量控制能力。",
		type: "competition",
		startDate: "2023-12-01",
		endDate: "2024-07-31",
		location: "武汉",
		organization: "程序设计与计算机设计类竞赛",
		skills: ["C++", "数据结构", "算法设计", "调试"],
		achievements: [
			"计算机能力挑战赛 C++ 组二等奖。",
			"计算机设计大赛三等奖。",
		],
		icon: "material-symbols:code-blocks-rounded",
		color: "#0891B2",
	},
];
