import type { PostForList } from "@utils/content-utils";

export type ExperienceCategory = "career" | "housing" | "life";

export type ExperienceStatus = "collecting" | "in-progress" | "stable";

export interface ExperienceTopic {
	id: string;
	title: string;
	description: string;
	category: ExperienceCategory;
	icon: string;
	matchTags: string[];
	matchCategories: string[];
	focus: string[];
	status: ExperienceStatus;
	featured?: boolean;
}

export interface ExperienceTopicWithPosts extends ExperienceTopic {
	posts: PostForList[];
}

export interface ExperienceCardProps {
	topic: ExperienceTopicWithPosts;
	maxPosts?: number;
}
