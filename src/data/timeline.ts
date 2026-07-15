import type { TimelineItem } from "../components/features/timeline/types";

export const timelineData: TimelineItem[] = [
	{
		id: "wuhan-surveying-algorithm-intern",
		title: "无人机视觉感知算法实习",
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
		id: "kotei-vision-perception-intern",
		title: "光庭视觉感知算法实习",
		description:
			"在武汉光庭技术股份有限公司参与 AVM 全景环视和 APA 自动泊车相关研发，围绕亚像素级角点检测、全景拼接质量优化、语义分割到三维点云映射和点云质量分析开展算法工作。",
		type: "internship",
		startDate: "2025-03-01",
		endDate: "2025-08-31",
		location: "武汉",
		organization: "武汉光庭技术股份有限公司",
		position: "视觉感知算法实习生",
		skills: ["C++", "OpenCV", "PCL", "CloudCompare", "AVM", "APA", "语义分割"],
		projects: [
			{
				name: "AVM 亚像素角点检测与拼接质量优化",
				summary:
					"围绕全景环视图像拼接场景，优化角点检测和特征匹配精度，提升环视拼接稳定性。",
				url: "/posts/kotei-vision-perception-internship-summary/",
			},
			{
				name: "语义分割结果到三维点云映射",
				summary:
					"使用 C++ 和 PCL 将二维语义图像信息映射到三维点云，并借助 CloudCompare 做可视化分析和质量评估。",
				url: "/posts/kotei-vision-perception-internship-summary/",
			},
		],
		achievements: [
			"熟悉 AVM、APA 等智能驾驶视觉感知模块的工程链路。",
			"积累了亚像素角点检测、点云映射和三维环境重建相关经验。",
		],
		icon: "material-symbols:linked-camera-rounded",
		color: "#7C3AED",
		featured: true,
	},
	{
		id: "car-terminal-test-dev-intern",
		title: "车载终端测试开发实习",
		description:
			"围绕 TBOX 定位与通信、运营平台上报、ECALL、DOIP、WiFi 和电源模式切换等场景，参与车载终端测试开发与自动化验证。",
		type: "internship",
		startDate: "2025-09-01",
		endDate: "2026-02-28",
		location: "武汉",
		organization: "INTEST（英泰斯特）",
		position: "测试开发实习生",
		skills: [
			"Python",
			"CANFD",
			"PCAN",
			"MobaXterm",
			"tensorCRT",
			"DOIP",
			"ECALL",
		],
		projects: [
			{
				name: "车载终端自动化测试脚本",
				summary:
					"把高频测试场景整理成可复用的脚本、命令和检查清单，方便后续回归验证。",
				url: "/posts/car-terminal-automation-test-scripts/",
			},
			{
				name: "TBOX 定位与通信功能测试",
				summary:
					"覆盖休眠唤醒、上电启动、长时间定位、模组重启、辅助定位、漂移检测和广播报文时序验证。",
				url: "/posts/car-terminal-tbox-location-communication-test/",
			},
			{
				name: "车载运营平台数据上报与诊断联动",
				summary:
					"覆盖在线/离线定位、SOS、质检、故障、代理应用、DOIP、ECALL 和网络切换等场景。",
				url: "/posts/car-terminal-platform-upload-diagnosis-ecall/",
			},
		],
		achievements: [
			"把定位、通信、平台上报和恢复机制整理成可执行的测试清单。",
			"熟悉 MobaXterm、PCAN、CANFD、tensorCRT 等工具的联调和排障流程。",
		],
		icon: "material-symbols:directions-car-rounded",
		color: "#0F766E",
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
		id: "robocup-xian-onsite-competition",
		title: "西安 RoboCup 现场参赛",
		description:
			"作为队长带队前往陕西西安参加中国机器人大赛 RoboCup 相关赛项，负责现场调度、赛前联调、问题排查和比赛节奏把控。",
		type: "competition",
		startDate: "2024-10-31",
		endDate: "2024-11-03",
		dateDisplay: "2024年10月31日 - 2024年11月3日",
		durationDisplay: "4天",
		location: "陕西西安",
		organization: "中国机器人大赛 RoboCup",
		position: "队长",
		skills: ["团队带队", "现场联调", "C++", "仿真调试", "比赛策略"],
		projects: [
			{
				name: "仿真机器人 C++ 程序",
				summary:
					"围绕仿真赛项完成策略验证、临场调参和异常处理，保障比赛期间程序稳定运行。",
			},
		],
		achievements: ["获得全国一等奖和全国三等奖两项。"],
		icon: "material-symbols:flag-rounded",
		color: "#DC2626",
		featured: true,
	},
	{
		id: "robocon-jiangyin-onsite-competition",
		title: "江阴 Robocon 现场参赛",
		description:
			"作为队长带队前往江苏无锡江阴市参加全国大学生机器人大赛 Robocon，负责现场组织、视觉模块联调和比赛流程协同。",
		type: "competition",
		startDate: "2024-07-10",
		endDate: "2024-07-13",
		dateDisplay: "2024年7月10日 - 2024年7月13日",
		durationDisplay: "4天",
		location: "江苏无锡江阴",
		organization: "全国大学生机器人大赛 Robocon",
		position: "队长",
		skills: ["团队带队", "OpenCV", "Jetson Nano", "视觉调试", "现场协作"],
		projects: [
			{
				name: "仿生四足机器人视觉模块",
				summary:
					"围绕四足机器人竞速任务进行视觉识别、路径感知和现场参数调试，支撑机器人在赛场环境下稳定运行。",
			},
		],
		achievements: ["获得全国三等奖两项。"],
		icon: "material-symbols:flag-rounded",
		color: "#EA580C",
		featured: true,
	},
	{
		id: "robocon-quadruped-vision-module",
		title: "Robocon 仿生四足机器人视觉模块",
		description:
			"面向全国大学生机器人大赛 Robocon 的仿生四足机器人竞速任务，负责视觉模块开发与调试，把赛道识别结果转化为可用于控制决策的路径信息。",
		type: "competition",
		startDate: "2024-03-01",
		endDate: "2024-07-09",
		location: "武汉",
		organization: "全国大学生机器人大赛 Robocon",
		position: "队长 / 视觉模块负责人",
		skills: ["OpenCV", "Jetson Nano", "C++", "图像处理", "视觉引导"],
		projects: [
			{
				name: "仿生四足机器人视觉模块",
				summary:
					"基于 OpenCV 完成灰度化、阈值分割、边缘提取和中线拟合，部署在 Jetson Nano 上实现低延迟路径识别。",
			},
		],
		achievements: [
			"完成从视觉识别、边缘提取到赛前联调的模块闭环。",
			"沉淀了嵌入式视觉部署和机器人现场调试经验。",
		],
		icon: "material-symbols:smart-toy-rounded",
		color: "#EA580C",
		featured: true,
	},
	{
		id: "robocup-jinjiang-onsite-competition",
		title: "晋江 RoboCup 现场参赛",
		description:
			"前往福建泉州晋江参加中国机器人大赛 RoboCup，这是第一次外出参加机器人赛事，主要完成现场适应、赛程执行和临场调试配合。",
		type: "competition",
		startDate: "2023-10-12",
		endDate: "2023-10-15",
		dateDisplay: "2023年10月12日 - 2023年10月15日",
		durationDisplay: "4天",
		location: "福建泉州晋江",
		organization: "中国机器人大赛 RoboCup",
		position: "参赛队员",
		skills: ["C++", "仿真调试", "现场参赛", "问题排查"],
		projects: [
			{
				name: "仿真机器人 C++ 程序",
				summary:
					"在现场比赛环境中配合完成程序运行、策略验证和异常问题排查，积累第一次外出参赛经验。",
			},
		],
		icon: "material-symbols:flag-rounded",
		color: "#DC2626",
	},
	{
		id: "robocup-simulation-cpp-program",
		title: "RoboCup 仿真机器人 C++ 程序",
		description:
			"面向中国机器人大赛 RoboCup 仿真赛项，负责机器人足球仿真程序开发与策略调试，重点处理路径规划、避障、队形协同和比赛策略控制。",
		type: "competition",
		startDate: "2023-09-01",
		endDate: "2023-10-11",
		dateDisplay: "2023年9月 - 2023年10月11日",
		location: "武汉",
		organization: "中国机器人大赛 RoboCup",
		position: "仿真程序开发",
		skills: ["C++", "MFC", "路径规划", "避障", "状态机", "仿真调试"],
		projects: [
			{
				name: "仿真机器人 C++ 程序",
				summary:
					"基于 C++ 构建机器人足球仿真策略逻辑，完成路径规划、碰撞检测、安全距离约束和策略调整。",
			},
		],
		achievements: [
			"在首次外出参赛前完成基础策略、仿真调试和现场运行准备。",
			"积累了机器人仿真程序设计与竞赛策略迭代经验。",
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
