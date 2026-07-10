import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	avatar: "/blog-assets/funny-avatar.webp",
	name: "Funny",
	bio: "计科 / 测科\n计算机视觉 / AI / 地震",
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
			name: "知乎",
			icon: "simple-icons:zhihu",
			url: "https://www.zhihu.com/people/li-yi-fan-96-1",
		},
		{
			name: "CSDN",
			icon: "simple-icons:csdn",
			url: "https://blog.csdn.net/qq_75045269?type=blog",
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
		{
			name: "小红书",
			icon: "simple-icons:xiaohongshu",
			url: "https://xhslink.com/m/XRs78CJdNs",
		},
	],
};
