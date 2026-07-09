import type { PioConfig } from "../types/config";

export const pioConfig: PioConfig = {
	enable: false,
	models: [],
	position: "left",
	width: 280,
	height: 250,
	mode: "draggable",
	hiddenOnMobile: true,
	hideAboutMenu: true,
	dialog: {
		welcome: "",
		touch: [],
		home: "",
		skin: ["", ""],
		close: "",
		link: "",
	},
};
