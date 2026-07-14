import fs from "node:fs";
import path from "node:path";

const targetDir = "src/content/moments";

function slugify(input) {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

function parseArgs(argv) {
	const options = {
		tags: [],
	};
	const contentParts = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith("--")) {
			contentParts.push(arg);
			continue;
		}

		const key = arg.slice(2);
		const value = argv[index + 1];
		if (key === "tag") {
			options.tags.push(value);
			index += 1;
		} else if (key === "pinned") {
			options.pinned = true;
		} else {
			options[key] = value;
			index += 1;
		}
	}

	return {
		content: contentParts.join(" ").trim(),
		options,
	};
}

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const { content, options } = parseArgs(process.argv.slice(2));

if (!content) {
	console.error(`Usage:
pnpm new-moment -- "今天的内容" --location "湖北省武汉市江汉区" --tag 生活

Optional:
--date 2026-07-05 --time 12:00 --id custom-id --photo /blog-assets/photo.webp --photo-title "照片标题" --pinned`);
	process.exit(1);
}

const now = new Date();
const date = options.date || formatDate(now);
const time = options.time || `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const id = options.id || `${date}-${slugify(content) || "moment"}`;
const filePath = path.join(targetDir, `${id}.json`);

if (fs.existsSync(filePath)) {
	console.error(`Moment already exists: ${filePath}`);
	process.exit(1);
}

const moment = {
	id,
	content,
	published: `${date}T${time}:00+08:00`,
	ipLocation: options.location || "",
	tags: options.tags.filter(Boolean),
};

if (options.pinned) {
	moment.pinned = true;
}

if (options.photo) {
	moment.photos = [
		{
			id: `${id}-photo`,
			src: options.photo,
			alt: options.photoTitle || content.slice(0, 24),
			title: options.photoTitle || content.slice(0, 24),
			description: content,
			date,
			location: options.location || "",
			tags: options.tags.filter(Boolean),
			aspectRatio: "4 / 3",
		},
	];
}

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(filePath, `${JSON.stringify(moment, null, "\t")}\n`);
console.log(`Moment created: ${filePath}`);
