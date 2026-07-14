import type { GalleryLinkType, GalleryPhoto } from "../types/album";

export const galleryFilterTypes: {
	value: GalleryLinkType | "all";
	label: string;
	icon: string;
}[] = [
	{
		value: "all",
		label: "全部",
		icon: "material-symbols:apps",
	},
	{
		value: "博客",
		label: "博客",
		icon: "material-symbols:article",
	},
	{
		value: "项目",
		label: "项目",
		icon: "material-symbols:work",
	},
	{
		value: "经验",
		label: "经验",
		icon: "material-symbols:psychology-alt-rounded",
	},
	{
		value: "实习",
		label: "实习",
		icon: "material-symbols:work",
	},
	{
		value: "说说",
		label: "说说",
		icon: "material-symbols:forum",
	},
];

export const galleryPhotos: GalleryPhoto[] = [
	{
		id: "building-system-home",
		src: "/blog-assets/building-system-home.png",
		alt: "建筑缺陷检测系统首页",
		title: "建筑缺陷检测系统首页",
		description: "把项目管理、三维模型和缺陷检测入口收束到一个桌面端工作台。",
		date: "2026-07-05",
		location: "武汉",
		tags: ["建筑缺陷", "PyQt5", "系统首页"],
		aspectRatio: "4 / 5",
		accent: "#16a34a",
		featured: true,
		links: [
			{
				type: "博客",
				label: "项目复盘",
				href: "/posts/project-building-defect-3d-system/",
			},
			{
				type: "项目",
				label: "建筑缺陷项目",
				href: "/projects/#building-defect-3d-system",
			},
			{
				type: "实习",
				label: "无人机视觉感知算法实习",
				href: "/timeline/#wuhan-surveying-algorithm-intern",
			},
		],
	},
	{
		id: "detection-ui-result",
		src: "/blog-assets/detection-ui-result.png",
		alt: "建筑外立面缺陷检测结果界面",
		title: "缺陷检测结果界面",
		description: "二维检测结果、缺陷类别和可复核流程在界面中集中展示。",
		date: "2026-07-05",
		location: "武汉",
		tags: ["目标检测", "SAHI", "缺陷识别"],
		aspectRatio: "16 / 10",
		accent: "#0ea5e9",
		links: [
			{
				type: "博客",
				label: "SAHI 切片检测",
				href: "/posts/sahi-for-building-facade-defect-detection/",
			},
			{
				type: "项目",
				label: "建筑缺陷项目",
				href: "/projects/#building-defect-3d-system",
			},
			{
				type: "经验",
				label: "实习找工作经验",
				href: "/experience/#career",
			},
		],
	},
	{
		id: "photo-3d-marker-linkage",
		src: "/blog-assets/photo-3d-marker-linkage.png",
		alt: "二维缺陷框到三维模型红点联动",
		title: "二维到三维红点联动",
		description: "把航拍照片中的缺陷框映射到实景三维模型，减少人工定位成本。",
		date: "2026-07-05",
		location: "武汉",
		tags: ["OSGB", "空间映射", "三维联动"],
		aspectRatio: "5 / 4",
		accent: "#f97316",
		links: [
			{
				type: "博客",
				label: "红点映射",
				href: "/posts/defect-2d-to-3d-red-marker/",
			},
			{
				type: "项目",
				label: "建筑缺陷项目",
				href: "/projects/#building-defect-3d-system",
			},
			{
				type: "实习",
				label: "无人机视觉感知算法实习",
				href: "/timeline/#wuhan-surveying-algorithm-intern",
			},
		],
	},
	{
		id: "report-export-ui",
		src: "/blog-assets/report-export-ui.png",
		alt: "建筑缺陷报告导出界面",
		title: "Word 报告导出",
		description: "从检测记录、人工复核到 Word 报告生成，形成可交付闭环。",
		date: "2026-07-05",
		location: "武汉",
		tags: ["报告导出", "Word", "工程闭环"],
		aspectRatio: "3 / 4",
		accent: "#2563eb",
		links: [
			{
				type: "博客",
				label: "报告导出",
				href: "/posts/word-report-export-for-building-defects/",
			},
			{
				type: "项目",
				label: "建筑缺陷项目",
				href: "/projects/#building-defect-3d-system",
			},
			{
				type: "实习",
				label: "无人机视觉感知算法实习",
				href: "/timeline/#wuhan-surveying-algorithm-intern",
			},
		],
	},
	{
		id: "smalldet-overall-architecture",
		src: "/blog-assets/smalldet-overall-architecture.webp",
		alt: "UAV-SmallDet 整体网络结构",
		title: "UAV-SmallDet 网络结构",
		description: "围绕无人机小目标检测设计的特征增强与定位优化框架。",
		date: "2025-08-20",
		location: "武汉",
		tags: ["SmallDet", "RT-DETR", "无人机"],
		aspectRatio: "4 / 3",
		accent: "#7c3aed",
		featured: true,
		links: [
			{
				type: "博客",
				label: "项目总览",
				href: "/posts/project-uav-smalldet/",
			},
			{
				type: "项目",
				label: "UAV-SmallDet",
				href: "/projects/#uav-smalldet",
			},
			{
				type: "实习",
				label: "无人机小目标科研项目",
				href: "/timeline/#uav-smalldet-lab",
			},
		],
	},
	{
		id: "smalldet-qualitative-scenes",
		src: "/blog-assets/smalldet-qualitative-scenes.svg",
		alt: "无人机小目标检测定性场景",
		title: "小目标定性场景",
		description: "对高空、密集、尺度变化明显的目标场景做可视化复盘。",
		date: "2025-08-20",
		location: "武汉",
		tags: ["可视化", "无人机", "小目标"],
		aspectRatio: "1 / 1",
		accent: "#a855f7",
		links: [
			{
				type: "博客",
				label: "创新点整理",
				href: "/posts/smalldet-innovation-hgpkinet/",
			},
			{
				type: "项目",
				label: "UAV-SmallDet",
				href: "/projects/#uav-smalldet",
			},
			{
				type: "实习",
				label: "无人机小目标科研项目",
				href: "/timeline/#uav-smalldet-lab",
			},
		],
	},
	{
		id: "smalldet-heatmap-visualization",
		src: "/blog-assets/smalldet-heatmap-visualization.svg",
		alt: "小目标检测热力图可视化",
		title: "热力图可视化",
		description: "用热力图观察模型对小目标区域的响应变化。",
		date: "2025-08-20",
		location: "武汉",
		tags: ["热力图", "模型解释", "实验复盘"],
		aspectRatio: "9 / 12",
		accent: "#ef4444",
		links: [
			{
				type: "博客",
				label: "STFL-Neck",
				href: "/posts/smalldet-innovation-stfl-neck/",
			},
			{
				type: "项目",
				label: "UAV-SmallDet",
				href: "/projects/#uav-smalldet",
			},
			{
				type: "实习",
				label: "无人机小目标科研项目",
				href: "/timeline/#uav-smalldet-lab",
			},
		],
	},
	{
		id: "hello-world-moment",
		src: "/blog-assets/funny-avatar.webp",
		alt: "Funny 头像",
		title: "第一条说说",
		description: "站点说说功能上线后的第一条记录。",
		date: "2026-07-05",
		location: "湖北省武汉市江汉区",
		tags: ["helloworld", "说说"],
		aspectRatio: "1 / 1",
		accent: "#db2777",
		links: [
			{
				type: "说说",
				label: "helloworld！",
				href: "/moments/#2026-07-05-hello-world",
			},
			{
				type: "经验",
				label: "生活经验",
				href: "/experience/#life",
			},
		],
	},
];
