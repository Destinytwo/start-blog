import type { SiteConfig } from "../types/config";

export const SITE_LANG = "zh_CN";

export const siteConfig: SiteConfig = {
	title: "Funny",
	subtitle: "一切刚刚结束，一切刚刚开始。",
	siteURL: "https://example.com/",
	keywords: ["Funny", "计算机视觉", "无人机目标检测", "个人博客", "项目案例"],
	siteStartDate: "2026-07-01",
	lang: SITE_LANG,
	themeColor: {
		hue: 338,
		fixed: false,
	},
	featurePages: {
		anime: false,
		diary: false,
		friends: false,
		moments: true,
		projects: true,
		experience: true,
		skills: false,
		timeline: false,
		albums: false,
		devices: false,
		aiTools: false,
	},
	navbarTitle: {
		mode: "text-icon",
		text: "Funny",
		icon: "/blog-assets/funny-avatar.webp",
		logo: "/blog-assets/funny-avatar.webp",
	},
	pageScaling: {
		enable: true,
		targetWidth: 2000,
	},
	postListLayout: {
		defaultMode: "list",
		enable: true,
		allowSwitch: true,
		categoryBar: {
			enable: true,
		},
	},
	tagStyle: {
		useNewStyle: true,
	},
	wallpaperMode: {
		defaultMode: "fullscreen",
		showModeSwitchOnMobile: "off",
	},
	banner: {
		src: {
			desktop: "/blog-assets/home-cover.jpg",
			mobile: "/blog-assets/home-cover.jpg",
		},
		position: "center",
		carousel: {
			enable: false,
			interval: 3,
			switchable: false,
		},
		waves: {
			enable: true,
			performanceMode: false,
			mobileDisable: false,
			switchable: false,
		},
		imageApi: {
			enable: false,
			url: "",
		},
		homeText: {
			enable: true,
			title: "",
			subtitle: ["一切刚刚结束，一切刚刚开始。"],
			switchable: false,
			typewriter: {
				enable: true,
				speed: 100,
				deleteSpeed: 50,
				pauseTime: 2400,
			},
		},
		credit: {
			enable: false,
			text: "",
			url: "",
		},
		navbar: {
			transparentMode: "semifull",
		},
	},
	toc: {
		enable: true,
		mobileTop: true,
		desktopSidebar: false,
		floating: true,
		depth: 2,
		useJapaneseBadge: false,
	},
	showCoverInContent: true,
	generateOgImages: false,
	favicon: [
		{
			src: "/favicon/avatar-favicon.png?v=avatar",
			sizes: "128x128",
		},
	],
	showLastModified: true,
	pageProgressBar: {
		enable: false,
		height: 3,
		duration: 6000,
	},
	thirdPartyAnalytics: {
		enable: false,
		clarityId: "",
	},
	card: {
		border: true,
		followTheme: false,
	},
	imageOptimization: {
		formats: "webp",
		quality: 85,
		noReferrerDomains: [],
	},
};
