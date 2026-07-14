import type { GalleryLink, GalleryLinkType } from "../types/album";
import { experiencesData } from "./experiences";
import { projectsData } from "./projects";
import { timelineData } from "./timeline";

export type ContentLinkInput =
	| {
			kind: "post";
			slug: string;
			label?: string;
	  }
	| {
			kind: "project";
			id: string;
			label?: string;
	  }
	| {
			kind: "experience";
			id: string;
			label?: string;
	  }
	| {
			kind: "timeline";
			id: string;
			label?: string;
	  }
	| {
			kind: "moment";
			id: string;
			label?: string;
	  };

const linkTypeByKind: Record<ContentLinkInput["kind"], GalleryLinkType> = {
	post: "博客",
	project: "项目",
	experience: "经验",
	timeline: "实习",
	moment: "说说",
};

const normalizeSlug = (slug: string) => slug.replace(/^\/+|\/+$/g, "");

export function createContentLink(input: ContentLinkInput): GalleryLink {
	switch (input.kind) {
		case "post":
			return {
				type: linkTypeByKind[input.kind],
				label: input.label ?? "博客记录",
				href: `/posts/${normalizeSlug(input.slug)}/`,
			};
		case "project": {
			const project = projectsData.find((item) => item.id === input.id);
			return {
				type: linkTypeByKind[input.kind],
				label: input.label ?? project?.title ?? input.id,
				href: `/projects/#${input.id}`,
			};
		}
		case "experience": {
			const experience = experiencesData.find((item) => item.id === input.id);
			return {
				type: linkTypeByKind[input.kind],
				label: input.label ?? experience?.title ?? input.id,
				href: `/experience/#${input.id}`,
			};
		}
		case "timeline": {
			const timeline = timelineData.find((item) => item.id === input.id);
			return {
				type: linkTypeByKind[input.kind],
				label: input.label ?? timeline?.title ?? input.id,
				href: `/timeline/#${input.id}`,
			};
		}
		case "moment":
			return {
				type: linkTypeByKind[input.kind],
				label: input.label ?? "说说",
				href: `/moments/#${input.id}`,
			};
	}
}

export function createContentLinks(inputs: ContentLinkInput[]): GalleryLink[] {
	const seen = new Set<string>();

	return inputs
		.map(createContentLink)
		.filter((link) => {
			const key = `${link.type}:${link.href}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
}
