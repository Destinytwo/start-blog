import type { NavBarConfig } from "../types/config";
import { LinkPreset } from "../types/config";

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "项目",
			url: "/projects/",
			icon: "material-symbols:work",
		},
		{
			name: "经验",
			url: "/experience/",
			icon: "material-symbols:psychology-alt-rounded",
		},
		{
			name: "经历",
			url: "/timeline/",
			icon: "material-symbols:timeline",
		},
		{
			name: "相册",
			url: "/albums/",
			icon: "material-symbols:photo-library",
		},
		{
			name: "说说",
			url: "/moments/",
			icon: "material-symbols:forum",
		},
		{
			name: "关于",
			url: "/about/",
			icon: "material-symbols:person",
		},
	],
};
