// Project data configuration file

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: string;
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	visitUrl?: string;
	featured?: boolean;
	showImage?: boolean;
}

export const projectsData: Project[] = [
	{
		"id": "building-defect-3d-system",
		"title": "基于实景三维模型的建筑物缺陷检测系统",
		"description": "围绕建筑外立面巡检场景，构建实景三维模型、航拍二维影像、缺陷检测模型和报告导出的完整闭环。",
		"image": "/blog-assets/detection-ui-result.png",
		"category": "建筑缺陷项目",
		"techStack": [
			"Python",
			"PyQt5",
			"FastAPI",
			"SAHI",
			"Ultralytics",
			"OpenSceneGraph",
			"SQLite"
		],
		"status": "completed",
		"featured": true,
		"visitUrl": "/posts/project-building-defect-3d-system/",
		"showImage": true
	},
	{
		"id": "car-terminal-automation-test-scripts",
		"title": "车载终端自动化测试脚本",
		"description": "围绕 TBOX 定位、平台上报、诊断联动、ECALL 和网络切换，拆解可复用回归脚本的流程设计、关键代码片段、判定条件和异常检查清单。",
		"image": "/blog-assets/car-terminal-test-cover.svg",
		"category": "车载测试项目",
		"techStack": [
			"Python",
			"Shell",
			"Linux",
			"CANFD",
			"PCAN",
			"MobaXterm"
		],
		"status": "completed",
		"featured": true,
		"visitUrl": "/posts/car-terminal-automation-test-scripts/",
		"showImage": true
	},
	{
		"id": "kotei-vision-perception-internship",
		"title": "自动驾驶视觉感知算法实习项目",
		"description": "围绕 AVM 全景环视、语义建图和点云映射，整理亚像素角点检测、PCD 预处理、APA/MPA 指标计算和 CloudCompare 可视化分析工作。",
		"image": "/blog-assets/kotei-vision-perception-cover.svg",
		"category": "视觉算法项目",
		"techStack": [
			"C++",
			"OpenCV",
			"PCL",
			"CloudCompare",
			"AVM",
			"APA"
		],
		"status": "completed",
		"featured": true,
		"visitUrl": "/posts/kotei-vision-perception-internship-summary/",
		"showImage": true
	},
	{
		"id": "robocon-quadruped-vision-module",
		"title": "Robocon 仿生四足机器人视觉模块",
		"description": "面向四足机器人竞速任务，基于相机输入、ROI 裁剪、阈值分割、轮廓筛选和中线拟合输出路径偏移与方向误差。",
		"image": "",
		"category": "机器人竞赛项目",
		"techStack": [
			"Python",
			"OpenCV",
			"Jetson Nano",
			"ROS",
			"图像处理",
			"视觉引导"
		],
		"status": "completed",
		"featured": true,
		"visitUrl": "/posts/robocon-quadruped-vision-module/",
		"showImage": false
	}
];

export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter((p) => p.status === "completed").length;
	const inProgress = projectsData.filter((p) => p.status === "in-progress").length;
	const planned = projectsData.filter((p) => p.status === "planned").length;
	return { total, byStatus: { completed, inProgress, planned } };
};

export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") return projectsData;
	return projectsData.filter((p) => p.category === category);
};

export const getFeaturedProjects = () => projectsData.filter((p) => p.featured);

export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => project.techStack.forEach((tech) => techSet.add(tech)));
	return Array.from(techSet).sort();
};
