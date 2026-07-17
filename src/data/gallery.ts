import type { GalleryLinkType, GalleryPhoto } from "../types/album";
import { getResponsiveImage } from "../utils/responsive-media";
import { createContentLinks } from "./content-links";
import { generatedGalleryPhotos } from "./generated-gallery";
import { getMomentGalleryPhotos } from "./moments";

type GalleryFilterType = GalleryLinkType | "竞赛" | "旅行" | "美食" | "美景";

export const galleryFilterTypes: {
	value: GalleryFilterType | "all";
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
	{
		value: "竞赛",
		label: "竞赛",
		icon: "material-symbols:emoji-events",
	},
	{
		value: "旅行",
		label: "旅行",
		icon: "material-symbols:travel-explore",
	},
	{
		value: "美食",
		label: "美食",
		icon: "material-symbols:restaurant",
	},
	{
		value: "美景",
		label: "美景",
		icon: "material-symbols:landscape",
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

const surveyingProgrammingRelations = [
	{
		kind: "project",
		id: "surveying-programming-suite",
		label: "测绘竞赛项目",
	},
	{ kind: "timeline", id: "surveying-gis-competition" },
] as const;

const manualGalleryPhotos: GalleryPhoto[] = [
	withResponsiveImage({
		id: "surveying-profile-section-result",
		src: "/blog-assets/surveying-profile-section-result.png",
		alt: "测绘程序设计纵横断面计算结果",
		title: "测绘竞赛三合一工具",
		description: "围绕大地线长度、纵横断面和曲线拟合整理的 C++ / MFC 测绘程序设计项目复盘。",
		date: "2024-07-22",
		location: "武汉",
		tags: ["测绘程序设计", "C++", "MFC", "纵横断面"],
		aspectRatio: "16 / 10",
		accent: "#d97706",
		featured: true,
		links: createContentLinks([
			{
				kind: "post",
				slug: "surveying-profile-cross-section",
				label: "纵横断面复盘",
			},
			...surveyingProgrammingRelations,
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
	...generatedGalleryPhotos,
	...getMomentGalleryPhotos(),
];
