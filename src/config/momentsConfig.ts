export const momentsConfig = {
	comments: {
		enable: true,
		provider: "gitalk",
		gitalk: {
			clientID:
				import.meta.env.GITALK_CLIENT_ID ||
				import.meta.env.PUBLIC_GITALK_CLIENT_ID ||
				"",
			clientSecret:
				import.meta.env.GITALK_CLIENT_SECRET ||
				import.meta.env.PUBLIC_GITALK_CLIENT_SECRET ||
				"",
			owner: "Destinytwo",
			repo: "start-blog",
			admin: ["Destinytwo", "Funnyfyl"],
			labels: ["moments"],
			distractionFreeMode: false,
			proxy:
				"https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token",
		},
	},
};
