export interface TimelineLink {
	name: string;
	url: string;
	type: "website" | "certificate" | "project" | "other";
}

export interface TimelineProject {
	name: string;
	summary: string;
	url?: string;
}

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "internship" | "competition" | "project" | "lab";
	startDate: string;
	endDate?: string;
	dateDisplay?: string;
	durationDisplay?: string;
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	projects?: TimelineProject[];
	achievements?: string[];
	links?: TimelineLink[];
	icon?: string;
	color?: string;
	featured?: boolean;
}

export interface TimelineCardProps {
	item: TimelineItem;
	maxSkills?: number;
}
