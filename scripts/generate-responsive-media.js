import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sourceRoots = ["public/blog-assets"];
const outputRoot = "public/generated/media";
const manifestPath = path.join(outputRoot, "manifest.json");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const targetWidths = [360, 640, 960, 1280, 1600];
const formats = [
	{ ext: "avif", options: { quality: 50 } },
	{ ext: "webp", options: { quality: 78 } },
];

function walk(dir) {
	if (!fs.existsSync(dir)) return [];

	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return walk(fullPath);
		}
		return [fullPath];
	});
}

function toPublicPath(filePath) {
	return `/${path.relative("public", filePath).replaceAll(path.sep, "/")}`;
}

function getOutputPath(inputPath, width, ext) {
	const relativePath = path.relative("public", inputPath);
	const parsed = path.parse(relativePath);
	return path.join(
		outputRoot,
		parsed.dir,
		`${parsed.name}-${width}.${ext}`,
	);
}

function isFresh(inputPath, outputPath) {
	if (!fs.existsSync(outputPath)) return false;
	return fs.statSync(outputPath).mtimeMs >= fs.statSync(inputPath).mtimeMs;
}

async function generateVariant(inputPath, outputPath, width, ext, options) {
	if (isFresh(inputPath, outputPath)) {
		return;
	}

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	await sharp(inputPath)
		.rotate()
		.resize({ width, withoutEnlargement: true })
		.toFormat(ext, options)
		.toFile(outputPath);
}

async function processImage(inputPath) {
	const metadata = await sharp(inputPath).metadata();
	if (!metadata.width || !metadata.height) {
		return null;
	}

	const widths = targetWidths.filter((width) => width < metadata.width);
	const largestWidth = Math.min(metadata.width, targetWidths.at(-1) ?? metadata.width);
	if (!widths.includes(largestWidth)) {
		widths.push(largestWidth);
	}

	const entry = {
		width: metadata.width,
		height: metadata.height,
		avif: [],
		webp: [],
	};

	for (const format of formats) {
		for (const width of widths) {
			const outputPath = getOutputPath(inputPath, width, format.ext);
			await generateVariant(
				inputPath,
				outputPath,
				width,
				format.ext,
				format.options,
			);
			entry[format.ext].push({
				src: toPublicPath(outputPath),
				width,
			});
		}
	}

	return entry;
}

async function main() {
	const files = sourceRoots
		.flatMap(walk)
		.filter((file) => imageExtensions.has(path.extname(file).toLowerCase()));

	const manifest = {};

	for (const file of files) {
		const entry = await processImage(file);
		if (entry) {
			manifest[toPublicPath(file)] = entry;
		}
	}

	fs.mkdirSync(outputRoot, { recursive: true });
	fs.writeFileSync(`${manifestPath}.tmp`, JSON.stringify(manifest, null, "\t"));
	fs.renameSync(`${manifestPath}.tmp`, manifestPath);
	console.log(`Generated responsive media manifest for ${Object.keys(manifest).length} images.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
