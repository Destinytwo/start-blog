export interface Photo {
	id?: string;
	src: string;
	alt?: string;
	title?: string;
	thumbnail?: string;
	tags?: string[];
	description?: string;
	date?: string;
	location?: string;
	width?: number;
	height?: number;
}

export type GalleryLinkType = "博客" | "项目" | "经验" | "实习" | "说说";

export interface GalleryLink {
	type: GalleryLinkType;
	label: string;
	href: string;
}

export interface ResponsiveImageSource {
	type: string;
	srcset: string;
}

export interface ResponsiveImageData {
	src: string;
	sizes?: string;
	sources?: ResponsiveImageSource[];
	width?: number;
	height?: number;
}

export interface GalleryPhoto {
	id: string;
	src: string;
	alt: string;
	title: string;
	description?: string;
	date?: string;
	location?: string;
	tags?: string[];
	links: GalleryLink[];
	aspectRatio?: string;
	accent?: string;
	featured?: boolean;
	image?: ResponsiveImageData;
}

export interface AlbumGroup {
	id: string;
	title: string;
	description?: string;
	cover: string;
	date: string;
	location?: string;
	tags?: string[];
	photos: Photo[];
	password?: string;
	passwordHint?: string;
}
