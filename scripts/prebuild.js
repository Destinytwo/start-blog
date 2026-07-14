import { spawnSync } from "node:child_process";

function runScript(script, { allowFailure = false } = {}) {
	const result = spawnSync(process.execPath, [script], {
		stdio: "inherit",
		shell: false,
	});

	if (result.status !== 0 && !allowFailure) {
		process.exit(result.status ?? 1);
	}
}

runScript("scripts/sync-content.js", { allowFailure: true });
runScript("scripts/generate-responsive-media.js");
