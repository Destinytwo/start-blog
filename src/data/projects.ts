// Project data configuration file

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: string;
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	sourceCode?: string;
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
		"sourceCode": "",
		"showImage": true
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
