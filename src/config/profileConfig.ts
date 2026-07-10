import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	avatar: "/blog-assets/funny-avatar.webp",
	name: "Funny",
	bio: "果壳er~｜计算机视觉 / 无人机目标检测",
	typewriter: {
		enable: true,
		speed: 80,
	},
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/Funnyfyl",
		},
		{
			name: "Email",
			icon: "material-symbols:mail-outline",
			url: "mailto:funny_fyl@163.com",
		},
		{
			name: "微信",
			icon: "fa7-brands:weixin",
			url: "/about/#contact",
		},
	],
};
