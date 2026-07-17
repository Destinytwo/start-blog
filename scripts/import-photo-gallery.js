import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const projectRoot = path.resolve(".");
const sourceRoot =
	process.env.PHOTO_GALLERY_SOURCE || "F:\\\u76f8\u518c";
const outputRoot = path.join(
	projectRoot,
	"public",
	"generated",
	"photo-gallery",
);
const dataOutputPath = path.join(
	projectRoot,
	"src",
	"data",
	"generated-gallery.ts",
);

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const sizes = [
	{ name: "thumb", width: 520, quality: 72 },
	{ name: "medium", width: 1200, quality: 78 },
	{ name: "large", width: 1800, quality: 82 },
];

const albumConfigs = {
	"INTEST实习之旅": {
		slug: "intest-internship",
		title: "INTEST 实习之旅",
		description: "车载终端测试开发实习期间的生活、通勤和工作片段。",
		date: "2025-09-01",
		location: "武汉",
		accent: "#0f766e",
		tags: ["实习", "武汉", "工作记录"],
		relations: [
			{ kind: "timeline", id: "car-terminal-test-dev-intern", label: "车载终端测试开发实习" },
			{ kind: "project", id: "car-terminal-automation-test-scripts", label: "自动化测试脚本" },
			{ kind: "post", slug: "car-terminal-test-development-summary", label: "实习总结" },
		],
	},
	"武汉市测绘研究院实习之旅": {
		slug: "wuhan-surveying-internship",
		title: "武汉市测绘研究院实习之旅",
		description: "无人机视觉感知算法实习期间，与建筑缺陷检测项目相关的环境和日常片段。",
		date: "2026-03-01",
		location: "武汉",
		accent: "#16a34a",
		tags: ["实习", "武汉", "项目现场"],
		relations: [
			{ kind: "timeline", id: "wuhan-surveying-algorithm-intern", label: "无人机视觉感知算法实习" },
			{ kind: "project", id: "building-defect-3d-system", label: "建筑缺陷项目" },
			{ kind: "post", slug: "project-building-defect-3d-system", label: "项目总览" },
		],
	},
	"泉州竞赛之旅": {
		slug: "quanzhou-robocup-trip",
		title: "泉州 RoboCup 竞赛之旅",
		description: "第一次外出参加 RoboCup 机器人赛事的现场、城市和出行记录。",
		date: "2023-10-12",
		location: "福建泉州晋江",
		accent: "#dc2626",
		tags: ["竞赛", "旅行", "泉州", "RoboCup"],
		relations: [
			{ kind: "timeline", id: "robocup-jinjiang-onsite-competition", label: "晋江 RoboCup 现场参赛" },
		],
	},
	"江阴竞赛之旅": {
		slug: "jiangyin-robocon-trip",
		title: "江阴 Robocon 竞赛之旅",
		description: "作为队长带队参加 Robocon 现场赛期间的比赛、城市和团队记录。",
		date: "2024-07-10",
		location: "江苏无锡江阴",
		accent: "#ea580c",
		tags: ["竞赛", "旅行", "江阴", "Robocon"],
		relations: [
			{ kind: "timeline", id: "robocon-jiangyin-onsite-competition", label: "江阴 Robocon 现场参赛" },
			{ kind: "timeline", id: "robocon-quadruped-vision-module", label: "四足机器人视觉模块" },
			{ kind: "project", id: "robocon-quadruped-vision-module", label: "四足视觉项目" },
			{ kind: "post", slug: "robocon-quadruped-vision-module", label: "视觉模块博客" },
		],
	},
	"西安竞赛之旅": {
		slug: "xian-robocup-trip",
		title: "西安 RoboCup 竞赛之旅",
		description: "带队参加西安 RoboCup 现场赛期间的比赛、城市和团队记录。",
		date: "2024-10-31",
		location: "陕西西安",
		accent: "#dc2626",
		tags: ["竞赛", "旅行", "西安", "RoboCup"],
		relations: [
			{ kind: "timeline", id: "robocup-xian-onsite-competition", label: "西安 RoboCup 现场参赛" },
		],
	},
	"咸宁温泉旅游": {
		slug: "xianning-hot-spring-trip",
		title: "咸宁温泉旅游",
		description: "咸宁温泉旅行中的城市、美景和生活记录。",
		date: "2024-01-01",
		location: "湖北咸宁",
		accent: "#0891b2",
		tags: ["旅行", "生活", "咸宁"],
		relations: [
			{ kind: "experience", id: "life", label: "生活经验" },
		],
	},
};

const visualTagAnnotations = {
	"江阴竞赛之旅": {
		美食: [5, 11, 25],
		美景: [4, 6, 7, 8, 10, 12, 15, 16, 17, 18, 19, 20, 21, 22, 27],
	},
	"泉州竞赛之旅": {
		美食: [4, 5, 6, 7, 9, 10, 11],
		美景: [3, 8],
	},
	"武汉市测绘研究院实习之旅": {
		美食: [
			2, 4, 6, 12, 13, 17, 20, 22, 24, 26, 27, 29, 30, 31, 32, 33, 34,
			35, 37, 38, 39, 40,
		],
		美景: [1, 3, 5, 7, 15, 16, 18, 21, 23, 28],
	},
	"西安竞赛之旅": {
		美食: [2, 5, 26, 27, 31],
		美景: [
			3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
			22, 23, 24, 25, 28, 30,
		],
	},
	"咸宁温泉旅游": {
		美食: [1, 2, 3, 7],
		美景: [4, 6],
	},
};

function toPosix(value) {
	return value.replaceAll(path.sep, "/");
}

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(dir) {
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.flatMap((entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) return walkFiles(fullPath);
			return [fullPath];
		});
}

function slugifyFileName(fileName, index) {
	const parsed = path.parse(fileName);
	const ascii = parsed.name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return ascii || `photo-${String(index + 1).padStart(3, "0")}`;
}

function outputPublicPath(filePath) {
	return `/${toPosix(path.relative(path.join(projectRoot, "public"), filePath))}`;
}

function escapeString(value) {
	return JSON.stringify(value);
}

function inferDate(filePath, fallbackDate) {
	const base = path.basename(filePath);
	const match14 = base.match(/(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})?(\d{2})?/);
	if (match14) {
		return `${match14[1]}-${match14[2]}-${match14[3]}`;
	}

	const timestamp = base.match(/(1[5-9]\d{11})/);
	if (timestamp) {
		const date = new Date(Number(timestamp[1]));
		if (!Number.isNaN(date.getTime())) {
			return date.toISOString().slice(0, 10);
		}
	}

	return fallbackDate;
}

function inferExtraTags(config, folderName, photoIndex) {
	const tags = new Set(config.tags);
	const visualTags = visualTagAnnotations[folderName] ?? {};
	for (const [tag, indices] of Object.entries(visualTags)) {
		if (indices.includes(photoIndex + 1)) tags.add(tag);
	}
	return [...tags];
}

function contentLinkExpression(input) {
	switch (input.kind) {
		case "post":
			return `{ kind: "post", slug: ${escapeString(input.slug)}, label: ${escapeString(input.label)} }`;
		case "project":
			return `{ kind: "project", id: ${escapeString(input.id)}, label: ${escapeString(input.label)} }`;
		case "experience":
			return `{ kind: "experience", id: ${escapeString(input.id)}, label: ${escapeString(input.label)} }`;
		case "timeline":
			return `{ kind: "timeline", id: ${escapeString(input.id)}, label: ${escapeString(input.label)} }`;
		default:
			throw new Error(`Unsupported relation kind: ${input.kind}`);
	}
}

async function processPhoto(inputPath, config, folderName, photoIndex) {
	const metadata = await sharp(inputPath).metadata();
	if (!metadata.width || !metadata.height) return null;

	const image = sharp(inputPath).rotate();
	const rotatedMetadata = await image.metadata();
	const width = rotatedMetadata.width || metadata.width;
	const height = rotatedMetadata.height || metadata.height;
	const baseName = slugifyFileName(path.basename(inputPath), photoIndex);
	const id = `${config.slug}-${String(photoIndex + 1).padStart(3, "0")}-${baseName}`;
	const outDir = path.join(outputRoot, config.slug);
	ensureDir(outDir);

	const outputs = {};
	for (const size of sizes) {
		const outputPath = path.join(outDir, `${id}-${size.name}.webp`);
		const isFresh =
			fs.existsSync(outputPath) &&
			fs.statSync(outputPath).mtimeMs >= fs.statSync(inputPath).mtimeMs;
		if (!isFresh) {
			await sharp(inputPath)
				.rotate()
				.resize({ width: size.width, withoutEnlargement: true })
				.webp({ quality: size.quality, effort: 5 })
				.toFile(outputPath);
		}
		outputs[size.name] = outputPublicPath(outputPath);
	}

	const date = inferDate(inputPath, config.date);
	const tags = inferExtraTags(config, folderName, photoIndex);
	const aspectRatio = `${width} / ${height}`;
	const title = `${config.title} ${String(photoIndex + 1).padStart(2, "0")}`;

	return {
		id,
		src: outputs.large,
		mediumSrc: outputs.medium,
		thumbSrc: outputs.thumb,
		alt: title,
		title,
		description: config.description,
		date,
		location: config.location,
		tags,
		aspectRatio,
		accent: config.accent,
		featured: photoIndex === 0,
		width,
		height,
		relations: config.relations,
	};
}

function renderGeneratedFile(photos) {
	const renderedPhotos = photos
		.map((photo) => {
			const linksExpr = `[${photo.relations.map(contentLinkExpression).join(", ")}]`;
			return `\twithResponsiveImage({\n\t\tid: ${escapeString(photo.id)},\n\t\tsrc: ${escapeString(photo.src)},\n\t\tthumbSrc: ${escapeString(photo.thumbSrc)},\n\t\tmediumSrc: ${escapeString(photo.mediumSrc)},\n\t\talt: ${escapeString(photo.alt)},\n\t\ttitle: ${escapeString(photo.title)},\n\t\tdescription: ${escapeString(photo.description)},\n\t\tdate: ${escapeString(photo.date)},\n\t\tlocation: ${escapeString(photo.location)},\n\t\ttags: ${JSON.stringify(photo.tags)},\n\t\taspectRatio: ${escapeString(photo.aspectRatio)},\n\t\taccent: ${escapeString(photo.accent)},\n\t\tfeatured: ${photo.featured ? "true" : "false"},\n\t\tlinks: createContentLinks(${linksExpr}),\n\t}),`;
		})
		.join("\n");

	return `import type { GalleryPhoto } from "../types/album";\nimport { createContentLinks } from "./content-links";\n\nconst galleryImageSizes =\n\t"(min-width: 1500px) 22vw, (min-width: 1180px) 28vw, (min-width: 760px) 42vw, 92vw";\n\nconst withResponsiveImage = (photo: GalleryPhoto): GalleryPhoto => ({\n\t...photo,\n\timage: {\n\t\tsrc: photo.thumbSrc ?? photo.src,\n\t\tsizes: galleryImageSizes,\n\t\twidth: photo.width,\n\t\theight: photo.height,\n\t\tsources: [\n\t\t\t{\n\t\t\t\ttype: "image/webp",\n\t\t\t\tsrcset: [\n\t\t\t\t\tphoto.thumbSrc ? photo.thumbSrc + " 520w" : "",\n\t\t\t\t\tphoto.mediumSrc ? photo.mediumSrc + " 1200w" : "",\n\t\t\t\t\tphoto.src + " 1800w",\n\t\t\t\t]\n\t\t\t\t\t.filter(Boolean)\n\t\t\t\t\t.join(", "),\n\t\t\t},\n\t\t],\n\t},\n});\n\nexport const generatedGalleryPhotos: GalleryPhoto[] = [\n${renderedPhotos}\n];\n`;
}

async function main() {
	if (!fs.existsSync(sourceRoot)) {
		throw new Error(`Photo source directory not found: ${sourceRoot}`);
	}

	ensureDir(outputRoot);
	const allPhotos = [];
	const folders = fs
		.readdirSync(sourceRoot, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

	for (const [albumIndex, folder] of folders.entries()) {
		const config = albumConfigs[folder.name];
		if (!config) {
			console.warn(`Skip unknown album folder: ${folder.name}`);
			continue;
		}
		const folderPath = path.join(sourceRoot, folder.name);
		const files = walkFiles(folderPath)
			.filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
			.sort((a, b) => path.basename(a).localeCompare(path.basename(b), "zh-CN"));
		for (const [photoIndex, file] of files.entries()) {
			const photo = await processPhoto(file, config, folder.name, photoIndex);
			if (photo) allPhotos.push(photo);
		}
		console.log(`${config.title}: ${files.length} photos`);
	}

	fs.writeFileSync(dataOutputPath, renderGeneratedFile(allPhotos), "utf8");
	console.log(`Generated ${allPhotos.length} gallery photos.`);
	console.log(`Data: ${dataOutputPath}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
