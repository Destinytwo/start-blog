import { DARK_MODE } from "@constants/constants";
import { getStoredTheme, setTheme } from "@utils/setting-utils";

const PERIODS = {
	morning: { label: "上午", start: 6, end: 12 },
	afternoon: { label: "下午", start: 12, end: 19 },
	dusk: { label: "黄昏", start: 19, end: 21 },
	evening: { label: "傍晚", start: 21, end: 24 },
	night: { label: "深夜", start: 0, end: 6 },
};

const MOBILE_VIDEO_MEDIA =
	"(max-width: 767px), ((pointer: coarse) and (max-width: 900px))";
const REDUCED_MOTION_MEDIA = "(prefers-reduced-motion: reduce)";

const PERIOD_THEME_COLORS = {
	morning: {
		hue: 18,
		light: {
			coverBg: "hsl(350 34% 18%)",
			pageBg: "hsl(18 42% 88%)",
			waves: [
				"hsl(350 38% 76%)",
				"hsl(12 48% 81%)",
				"hsl(30 54% 85%)",
				"hsl(18 42% 88%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(18 42% 88%) 78%, white 22%)",
				start: "hsl(344 78% 67%)",
				mid: "hsl(18 88% 66%)",
				end: "hsl(42 96% 62%)",
			},
		},
		dark: {
			coverBg: "hsl(350 30% 9%)",
			pageBg: "hsl(352 24% 13%)",
			waves: [
				"hsl(346 34% 24%)",
				"hsl(8 30% 19%)",
				"hsl(24 28% 16%)",
				"hsl(352 24% 13%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(352 24% 13%) 82%, white 8%)",
				start: "hsl(344 72% 58%)",
				mid: "hsl(18 78% 58%)",
				end: "hsl(42 88% 56%)",
			},
		},
	},
	afternoon: {
		hue: 188,
		light: {
			coverBg: "hsl(188 62% 16%)",
			pageBg: "hsl(188 52% 86%)",
			waves: [
				"hsl(188 68% 68%)",
				"hsl(188 63% 77%)",
				"hsl(188 56% 82%)",
				"hsl(188 52% 86%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(188 52% 86%) 76%, white 24%)",
				start: "hsl(190 86% 47%)",
				mid: "hsl(172 72% 51%)",
				end: "hsl(48 96% 62%)",
			},
		},
		dark: {
			coverBg: "hsl(188 54% 8%)",
			pageBg: "hsl(188 32% 12%)",
			waves: [
				"hsl(188 48% 23%)",
				"hsl(188 42% 18%)",
				"hsl(188 36% 15%)",
				"hsl(188 32% 12%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(188 32% 12%) 82%, white 8%)",
				start: "hsl(190 82% 44%)",
				mid: "hsl(164 76% 45%)",
				end: "hsl(48 88% 58%)",
			},
		},
	},
	dusk: {
		hue: 24,
		light: {
			coverBg: "hsl(24 68% 18%)",
			pageBg: "hsl(24 70% 86%)",
			waves: [
				"hsl(24 82% 66%)",
				"hsl(24 78% 75%)",
				"hsl(24 72% 82%)",
				"hsl(24 70% 86%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(24 70% 86%) 76%, white 24%)",
				start: "hsl(34 96% 59%)",
				mid: "hsl(12 88% 61%)",
				end: "hsl(292 56% 58%)",
			},
		},
		dark: {
			coverBg: "hsl(24 58% 9%)",
			pageBg: "hsl(24 34% 13%)",
			waves: [
				"hsl(24 58% 24%)",
				"hsl(24 48% 19%)",
				"hsl(24 40% 16%)",
				"hsl(24 34% 13%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(24 34% 13%) 82%, white 8%)",
				start: "hsl(32 90% 54%)",
				mid: "hsl(350 78% 58%)",
				end: "hsl(276 64% 58%)",
			},
		},
	},
	evening: {
		hue: 226,
		light: {
			coverBg: "hsl(226 52% 16%)",
			pageBg: "hsl(226 54% 86%)",
			waves: [
				"hsl(224 70% 68%)",
				"hsl(238 64% 76%)",
				"hsl(270 52% 83%)",
				"hsl(226 54% 86%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(226 54% 86%) 76%, white 24%)",
				start: "hsl(224 92% 58%)",
				mid: "hsl(270 78% 64%)",
				end: "hsl(334 82% 66%)",
			},
		},
		dark: {
			coverBg: "hsl(226 46% 9%)",
			pageBg: "hsl(226 30% 12%)",
			waves: [
				"hsl(224 48% 24%)",
				"hsl(244 40% 19%)",
				"hsl(270 34% 16%)",
				"hsl(226 30% 12%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(226 30% 12%) 82%, white 8%)",
				start: "hsl(224 82% 58%)",
				mid: "hsl(270 74% 62%)",
				end: "hsl(334 76% 62%)",
			},
		},
	},
	night: {
		hue: 224,
		light: {
			coverBg: "hsl(222 58% 12%)",
			pageBg: "hsl(214 48% 84%)",
			waves: [
				"hsl(218 60% 66%)",
				"hsl(204 58% 76%)",
				"hsl(188 48% 82%)",
				"hsl(214 48% 84%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(214 48% 84%) 72%, white 28%)",
				start: "hsl(218 82% 56%)",
				mid: "hsl(188 86% 52%)",
				end: "hsl(262 72% 62%)",
			},
		},
		dark: {
			coverBg: "hsl(224 58% 7%)",
			pageBg: "hsl(224 34% 10%)",
			waves: [
				"hsl(220 48% 22%)",
				"hsl(208 42% 17%)",
				"hsl(192 36% 14%)",
				"hsl(224 34% 10%)",
			],
			scrollbar: {
				track: "color-mix(in srgb, hsl(224 34% 10%) 84%, hsl(188 82% 54%) 8%)",
				start: "hsl(218 86% 58%)",
				mid: "hsl(188 90% 54%)",
				end: "hsl(262 78% 64%)",
			},
		},
	},
};

let currentThemePeriod = null;
const AUTO_THEME_STORAGE_KEY = "funny-cover-auto-theme";

function getPeriodByHour(hour) {
	if (hour >= 6 && hour < 12) return "morning";
	if (hour >= 12 && hour < 19) return "afternoon";
	if (hour >= 19 && hour < 21) return "dusk";
	if (hour >= 21 && hour < 24) return "evening";
	return "night";
}

function getIsDarkTheme() {
	const root = document.documentElement;
	return (
		root.classList.contains("dark") ||
		root.getAttribute("data-theme") === "dark"
	);
}

function applyFunnyCoverTheme(period) {
	const theme =
		PERIOD_THEME_COLORS[period] || PERIOD_THEME_COLORS.afternoon;
	const palette = getIsDarkTheme() ? theme.dark : theme.light;
	const root = document.documentElement;

	root.style.setProperty("--hue", String(theme.hue));
	root.style.setProperty("--funny-cover-bg", palette.coverBg);
	root.style.setProperty("--funny-page-bg", palette.pageBg);
	root.style.setProperty("--page-bg", "var(--funny-page-bg)");
	palette.waves.forEach((color, index) => {
		root.style.setProperty(`--funny-wave-${index + 1}`, color);
	});
	root.style.setProperty("--funny-wave-soft", palette.waves[0]);
	if (palette.scrollbar) {
		root.style.setProperty("--funny-scrollbar-track", palette.scrollbar.track);
		root.style.setProperty(
			"--funny-scrollbar-thumb-start",
			palette.scrollbar.start,
		);
		root.style.setProperty(
			"--funny-scrollbar-thumb-mid",
			palette.scrollbar.mid,
		);
		root.style.setProperty(
			"--funny-scrollbar-thumb-end",
			palette.scrollbar.end,
		);
	}
}

function syncSiteThemeForPeriod(period) {
	if (period === "night") {
		const currentTheme = getStoredTheme();
		if (currentTheme !== DARK_MODE) {
			sessionStorage.setItem(AUTO_THEME_STORAGE_KEY, currentTheme);
			setTheme(DARK_MODE);
		}
		return;
	}

	const previousTheme = sessionStorage.getItem(AUTO_THEME_STORAGE_KEY);
	if (previousTheme) {
		setTheme(previousTheme);
		sessionStorage.removeItem(AUTO_THEME_STORAGE_KEY);
	}
}

function applyThemeForPeriod(period) {
	currentThemePeriod = period;
	syncSiteThemeForPeriod(period);
	applyFunnyCoverTheme(period);
}

function mediaMatches(query, fallback = false) {
	if (!window.matchMedia) return fallback;
	return window.matchMedia(query).matches;
}

function shouldUseMobileVideo() {
	return mediaMatches(MOBILE_VIDEO_MEDIA, window.innerWidth <= 767);
}

function shouldUsePosterOnly() {
	return mediaMatches(REDUCED_MOTION_MEDIA);
}

function getPeriodAsset(video, period) {
	const desktopSrc = video.dataset[period];
	const mobileSrc = video.dataset[`${period}Mobile`];
	const poster = video.dataset[`${period}Poster`];
	return {
		poster,
		src: shouldUseMobileVideo() ? mobileSrc || desktopSrc : desktopSrc,
	};
}

function markVideoReady(video) {
	if (video.__funnyCoverReadyTimer) {
		window.clearTimeout(video.__funnyCoverReadyTimer);
		video.__funnyCoverReadyTimer = null;
	}
	video.classList.add("is-ready");
}

function scheduleVideoFallbackReveal(video) {
	if (video.__funnyCoverReadyTimer) {
		window.clearTimeout(video.__funnyCoverReadyTimer);
	}
	video.__funnyCoverReadyTimer = window.setTimeout(() => {
		markVideoReady(video);
	}, 1800);
}

function setVideoPeriod(video, period, force = false) {
	const { poster, src } = getPeriodAsset(video, period);
	if (!src && !poster) return;

	applyThemeForPeriod(period);
	if (poster && video.getAttribute("poster") !== poster) {
		video.setAttribute("poster", poster);
	}
	if (poster) {
		video.style.setProperty("--funny-cover-poster", `url("${poster}")`);
	}

	const posterOnly = shouldUsePosterOnly();
	const sourceKey = posterOnly ? `poster:${poster || period}` : src;
	if (
		!force &&
		video.dataset.currentPeriod === period &&
		video.dataset.currentSource === sourceKey
	) {
		return;
	}

	video.dataset.currentPeriod = period;
	video.dataset.currentSource = sourceKey;

	if (posterOnly) {
		video.pause();
		video.removeAttribute("src");
		video.load();
		markVideoReady(video);
		return;
	}

	if (!src) {
		markVideoReady(video);
		return;
	}
	video.classList.remove("is-ready");
	scheduleVideoFallbackReveal(video);
	if (video.getAttribute("src") !== src) {
		video.src = src;
		video.load();
	}
	const playPromise = video.play();
	if (playPromise) {
		playPromise.catch(() => {
			/* Autoplay can be blocked in unusual browser settings. */
		});
	}
	if (video.readyState >= 2 || video.error) {
		markVideoReady(video);
	}
}

function updateClock(clock) {
	const now = new Date();
	clock.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
}

export function initFunnyTimeCover() {
	const video = document.getElementById("funny-time-cover-video");
	if (!video || video.dataset.initialized === "true") return;

	video.dataset.initialized = "true";
	const select = document.getElementById("funny-time-cover-select");
	const clock = document.getElementById("funny-time-cover-clock");

	const choosePeriod = (force = false) => {
		const selected = select?.value || "auto";
		const period =
			selected === "auto" ? getPeriodByHour(new Date().getHours()) : selected;
		setVideoPeriod(video, period, force);
	};

	const savedMode = sessionStorage.getItem("funny-cover-period") || "auto";
	if (select) {
		select.value = savedMode;
		select.addEventListener("change", () => {
			sessionStorage.setItem("funny-cover-period", select.value);
			choosePeriod();
		});
	}

	for (const eventName of ["loadedmetadata", "loadeddata", "canplay", "error"]) {
		video.addEventListener(eventName, () => markVideoReady(video));
	}

	choosePeriod();

	const handleMediaChange = () => choosePeriod();
	const mobileQuery = window.matchMedia?.(MOBILE_VIDEO_MEDIA);
	const motionQuery = window.matchMedia?.(REDUCED_MOTION_MEDIA);
	for (const query of [mobileQuery, motionQuery]) {
		if (!query) continue;
		if (query.addEventListener) {
			query.addEventListener("change", handleMediaChange);
		} else if (query.addListener) {
			query.addListener(handleMediaChange);
		}
	}

	let resizeTimer;
	window.addEventListener(
		"resize",
		() => {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(handleMediaChange, 180);
		},
		{ passive: true },
	);

	if (clock) {
		updateClock(clock);
		window.setInterval(() => {
			updateClock(clock);
			if ((select?.value || "auto") === "auto") choosePeriod();
		}, 1000);
	}
}

const themeObserver = new MutationObserver(() => {
	if (currentThemePeriod) applyFunnyCoverTheme(currentThemePeriod);
});

themeObserver.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["class", "data-theme"],
});

export function syncFunnyPageSheet() {
	const sheet = document.querySelector(".funny-page-sheet");
	if (!sheet) return;

	const pageData = document.getElementById("page-overlay-data");
	const isHome =
		pageData?.dataset.isHome === "true" ||
		window.location.pathname === "/";
	const supportsDynamicViewport =
		window.CSS?.supports?.("height", "100dvh") ?? false;
	const isNarrow = window.matchMedia("(max-width: 1279px)").matches;
	const top = isHome
		? supportsDynamicViewport
			? "100dvh"
			: "100vh"
		: supportsDynamicViewport
			? "50dvh"
			: "50vh";

	sheet.classList.toggle("funny-page-sheet--home", isHome);
	sheet.classList.toggle("funny-page-sheet--inner", !isHome);
	sheet.classList.remove("no-banner-layout");
	if (isNarrow) {
		sheet.style.setProperty("position", "relative", "important");
		sheet.style.setProperty("top", "auto", "important");
		sheet.style.setProperty("margin-top", top, "important");
	} else {
		sheet.style.setProperty("position", "absolute", "important");
		sheet.style.setProperty("top", top, "important");
		sheet.style.setProperty("margin-top", "0", "important");
	}
	sheet.style.setProperty("z-index", "30", "important");
}

function syncFunnyInitialScroll() {
	if (window.location.hash) return;
	window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function scheduleFunnyPageSheetSync() {
	syncFunnyPageSheet();
	requestAnimationFrame(syncFunnyPageSheet);
	window.setTimeout(syncFunnyPageSheet, 80);
	window.setTimeout(syncFunnyPageSheet, 300);
	window.setTimeout(syncFunnyPageSheet, 800);
}

function scheduleFunnyPageStart() {
	syncFunnyInitialScroll();
	window.setTimeout(syncFunnyInitialScroll, 80);
}

initFunnyTimeCover();
scheduleFunnyPageSheetSync();
document.addEventListener("astro:page-load", initFunnyTimeCover);
document.addEventListener("swup:page:view", initFunnyTimeCover);
document.addEventListener("astro:page-load", scheduleFunnyPageSheetSync);
document.addEventListener("swup:page:view", scheduleFunnyPageSheetSync);
document.addEventListener("swup:contentReplaced", scheduleFunnyPageSheetSync);
document.addEventListener("astro:page-load", scheduleFunnyPageStart);
document.addEventListener("swup:page:view", scheduleFunnyPageStart);
