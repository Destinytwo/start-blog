import type { ContentLinkInput } from "./content-links";
import { createContentLinks } from "./content-links";
import type { GalleryPhoto } from "../types/album";
import { getResponsiveImage } from "../utils/responsive-media";

export interface MomentPhoto {
	id?: string;
	src: string;
	alt?: string;
	title?: string;
	description?: string;
	date?: string;
	location?: string;
	tags?: string[];
	aspectRatio?: string;
	accent?: string;
	featured?: boolean;
	links?: ContentLinkInput[];
}

export interface MomentItem {
	id: string;
	content: string;
	published: string;
	ipLocation: string;
	tags?: string[];
	pinned?: boolean;
	links?: ContentLinkInput[];
	photos?: MomentPhoto[];
}

const momentModules = import.meta.glob("../content/moments/*.json", {
	eager: true,
}) as Record<string, { default: MomentItem } | MomentItem>;

const momentsData: MomentItem[] = Object.values(momentModules).map((module) =>
	"default" in module ? module.default : module,
);

const galleryImageSizes =
	"(min-width: 1500px) 22vw, (min-width: 1180px) 28vw, (min-width: 760px) 42vw, 92vw";

const getMomentLinkLabel = (moment: MomentItem) =>
	moment.content.length > 18
		? `${moment.content.slice(0, 18)}...`
		: moment.content;

export const getMomentsList = () => {
	return [...momentsData].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.published).getTime() - new Date(a.published).getTime();
	});
};

export const getMomentCount = () => momentsData.length;

export const getMomentGalleryPhotos = (): GalleryPhoto[] =>
	getMomentsList().flatMap((moment) =>
		(moment.photos ?? []).map((photo, index) => {
			const date = photo.date ?? moment.published.slice(0, 10);
			const title = photo.title ?? getMomentLinkLabel(moment);
			const src = photo.src;

			return {
				id: photo.id ?? `${moment.id}-photo-${index + 1}`,
				src,
				alt: photo.alt ?? title,
				title,
				description: photo.description ?? moment.content,
				date,
				location: photo.location ?? moment.ipLocation,
				tags: photo.tags ?? moment.tags,
				aspectRatio: photo.aspectRatio,
				accent: photo.accent,
				featured: photo.featured,
				image: getResponsiveImage(src, galleryImageSizes),
				links: createContentLinks([
					{
						kind: "moment",
						id: moment.id,
						label: getMomentLinkLabel(moment),
					},
					...(moment.links ?? []),
					...(photo.links ?? []),
				]),
			};
		}),
	);
