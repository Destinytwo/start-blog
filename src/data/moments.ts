export interface MomentItem {
	id: string;
	content: string;
	published: string;
	ipLocation: string;
	tags?: string[];
	pinned?: boolean;
}

const momentsData: MomentItem[] = [
	{
		id: "2026-07-05-hello-world",
		content: "helloworld！",
		published: "2026-07-05T12:00:00+08:00",
		ipLocation: "湖北省武汉市江汉区",
		tags: ["第一条"],
	},
];

export const getMomentsList = () => {
	return [...momentsData].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.published).getTime() - new Date(a.published).getTime();
	});
};

export const getMomentCount = () => momentsData.length;
