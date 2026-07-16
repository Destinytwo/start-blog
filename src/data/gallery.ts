import type { GalleryLinkType, GalleryPhoto } from "../types/album";
import { getResponsiveImage } from "../utils/responsive-media";
import { createContentLinks } from "./content-links";
import { getMomentGalleryPhotos } from "./moments";

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

const galleryImageSizes =
	"(min-width: 1500px) 22vw, (min-width: 1180px) 28vw, (min-width: 760px) 42vw, 92vw";

const withResponsiveImage = (photo: GalleryPhoto): GalleryPhoto => ({
	...photo,
	image: getResponsiveImage(photo.src, galleryImageSizes),
});

const projectBuildingRelations = [
	{ kind: "project", id: "building-defect-3d-system", label: "建筑缺陷项目" },
	{ kind: "timeline", id: "wuhan-surveying-algorithm-intern" },
] as const;

const roboconQuadrupedRelations = [
	{
		kind: "project",
		id: "robocon-quadruped-vision-module",
		label: "四足视觉项目",
	},
	{ kind: "timeline", id: "robocon-quadruped-vision-module" },
] as const;

const manualGalleryPhotos: GalleryPhoto[] = [
	withResponsiveImage({
		id: "beedog-quadruped-robot",
		src: "/blog-assets/beedog-quadruped-robot.png",
		alt: "BeeDog 仿生四足机器人平台",
		title: "BeeDog 四足视觉平台",
		description: "用于 Robocon 仿生四足机器人视觉模块复盘的公开平台素材，重点记录相机输入、路径识别和现场调参链路。",
		date: "2024-07-09",
		location: "江苏无锡江阴",
		tags: ["Robocon", "四足机器人", "OpenCV", "视觉模块"],
		aspectRatio: "4 / 3",
		accent: "#ea580c",
		featured: true,
		links: createContentLinks([
			{
				kind: "post",
				slug: "robocon-quadruped-vision-module",
				label: "视觉模块复盘",
			},
			...roboconQuadrupedRelations,
		]),
	}),
	withResponsiveImage({
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
		links: createContentLinks([
			{
				kind: "post",
				slug: "project-building-defect-3d-system",
				label: "项目复盘",
			},
			...projectBuildingRelations,
		]),
	}),
	withResponsiveImage({
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
		links: createContentLinks([
			{
				kind: "post",
				slug: "sahi-for-building-facade-defect-detection",
				label: "SAHI 切片检测",
			},
			{
				kind: "project",
				id: "building-defect-3d-system",
				label: "建筑缺陷项目",
			},
			{
				kind: "experience",
				id: "career",
			},
		]),
	}),
	withResponsiveImage({
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
		links: createContentLinks([
			{
				kind: "post",
				slug: "defect-2d-to-3d-red-marker",
				label: "红点映射",
			},
			...projectBuildingRelations,
		]),
	}),
	withResponsiveImage({
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
		links: createContentLinks([
			{
				kind: "post",
				slug: "word-report-export-for-building-defects",
				label: "报告导出",
			},
			...projectBuildingRelations,
		]),
	}),
];

export const galleryPhotos: GalleryPhoto[] = [
	...manualGalleryPhotos,
	...getMomentGalleryPhotos(),
];
