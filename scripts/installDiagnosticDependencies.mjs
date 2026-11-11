import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** @type {Record<string, string>} */
const env = { CI: "true", COREPACK_ENABLE_DOWNLOAD_PROMPT: "0" };
// Install receives no DB, provider, or application credentials.
for (const key of ["PATH", "HOME", "COREPACK_HOME", "PNPM_HOME", "XDG_CACHE_HOME", "TMPDIR"]) {
  const value = process.env[key];
  if (value != null) env[key] = value;
}
const result = spawnSync(
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- Vercel supplies pnpm in PATH.
  "pnpm",
  ["install", "--frozen-lockfile", "--ignore-scripts", "--ignore-pnpmfile"],
  {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 300_000,
    maxBuffer: 1024 * 1024,
  },
);
if (result.error != null || result.status !== 0) {
  console.log("FOREWORD_DIAGNOSTIC_INSTALL_FAILED");
  process.exitCode = 1;
} else console.log("FOREWORD_DIAGNOSTIC_INSTALL_HOOKS_DISABLED");
