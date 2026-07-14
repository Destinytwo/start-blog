import fs from "node:fs";
import path from "node:path";

import type { ResponsiveImageData } from "../types/album";

interface ResponsiveMediaEntry {
	width?: number;
	height?: number;
	avif?: Array<{ src: string; width: number }>;
	webp?: Array<{ src: string; width: number }>;
}

type ResponsiveMediaManifest = Record<string, ResponsiveMediaEntry>;

let cachedManifest: ResponsiveMediaManifest | null | undefined;

const manifestPath = path.join(
	path.resolve("."),
	"public",
	"generated",
	"media",
	"manifest.json",
);

const loadManifest = (): ResponsiveMediaManifest | null => {
	if (cachedManifest !== undefined) {
		return cachedManifest;
	}

	try {
		cachedManifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf8"),
		) as ResponsiveMediaManifest;
	} catch {
		cachedManifest = null;
	}

	return cachedManifest;
};

const buildSrcset = (items?: Array<{ src: string; width: number }>) =>
	items?.map((item) => `${item.src} ${item.width}w`).join(", ");

export function getResponsiveImage(
	src: string,
	sizes = "(min-width: 1180px) 30vw, (min-width: 760px) 45vw, 92vw",
): ResponsiveImageData | undefined {
	const manifest = loadManifest();
	const entry = manifest?.[src];
	if (!entry) {
		return undefined;
	}

	const avifSrcset = buildSrcset(entry.avif);
	const webpSrcset = buildSrcset(entry.webp);

	return {
		src,
		sizes,
		width: entry.width,
		height: entry.height,
		sources: [
			...(avifSrcset ? [{ type: "image/avif", srcset: avifSrcset }] : []),
			...(webpSrcset ? [{ type: "image/webp", srcset: webpSrcset }] : []),
		],
	};
}
