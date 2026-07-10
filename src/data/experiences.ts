import type { ExperienceTopic } from "@components/features/experience";

export const experiencesData: ExperienceTopic[] = [
	{
		id: "career",
		title: "实习找工作经验",
		description: "记录简历、投递、面试、实习选择和从学生到职场的阶段复盘。",
		category: "career",
		icon: "material-symbols:work-history-rounded",
		matchTags: ["实习", "找工作", "求职", "面试", "简历", "校招", "职业"],
		matchCategories: ["实习找工作经验", "求职经验", "职业经验"],
		focus: ["简历", "投递", "面试", "实习", "校招"],
		status: "collecting",
		featured: true,
	},
	{
		id: "housing",
		title: "租房经验",
		description: "整理看房、合同、预算、通勤、室友和入住后的避坑记录。",
		category: "housing",
		icon: "material-symbols:home-work-rounded",
		matchTags: ["租房", "看房", "合同", "通勤", "搬家", "室友", "房租"],
		matchCategories: ["租房经验", "住房经验"],
		focus: ["看房", "合同", "预算", "通勤", "入住"],
		status: "collecting",
	},
	{
		id: "life",
		title: "生活经验",
		description: "沉淀日常选择、效率、消费、关系和自我管理方面的经验。",
		category: "life",
		icon: "material-symbols:emoji-objects-rounded",
		matchTags: ["生活", "复盘", "效率", "消费", "自我管理", "日常"],
		matchCategories: ["生活经验", "日常经验"],
		focus: ["日常", "效率", "消费", "关系", "复盘"],
		status: "collecting",
	},
];
