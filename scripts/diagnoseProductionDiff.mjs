import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { diagnosticErrorClass } from "../packages/db/scripts/diagnosticErrorClass.mjs";
import { diagnosticErrorCode } from "../packages/db/scripts/diagnosticErrorCode.mjs";
import { assertProductionSchemaDiff } from "./assertProductionSchemaDiff.mjs";

// This branch is diagnostic only. A successful diagnostic must still fail the Vercel build.
process.exitCode = 1;

function diagnoseProductionDiff() {
  if (process.env.VERCEL_ENV !== "production") return { result: "NOT_PRODUCTION" };
  if (!process.env.DATABASE_URL?.trim()) return { result: "DATABASE_URL_MISSING" };
  const require = createRequire(new URL("../packages/db/package.json", import.meta.url));

  // Datasource -> datamodel diff introspects and renders SQL; it never applies SQL.
  // No migrations input, shadow DB, or write-capable CLI command is reachable.
  const result = spawnSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "diff",
      "--config",
      fileURLToPath(new URL("../packages/db/prisma.production.config.mjs", import.meta.url)),
      "--from-config-datasource",
      "--to-schema",
      fileURLToPath(new URL("../packages/db/prisma/schema", import.meta.url)),
      "--script",
      "--exit-code",
    ],
    {
      cwd: fileURLToPath(new URL("../packages/db/", import.meta.url)),
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    },
  );
  const signals = new Set(["SIGTERM", "SIGKILL", "SIGABRT", "SIGSEGV", "SIGINT"]);
  const signal = result.signal != null && signals.has(result.signal) ? result.signal : null;
  const exitCode =
    result.status != null && [0, 1, 2].includes(result.status) ? result.status : null;
  if (result.error != null && "code" in result.error && result.error.code === "ETIMEDOUT")
    return { result: "CLI_TIMEOUT", exitCode };
  if (result.error != null || result.status == null)
    return {
      result: "CLI_PROCESS_FAILURE",
      exitCode,
      signal,
      errorCode: diagnosticErrorCode(result.error),
      errorClass: diagnosticErrorClass(result.error),
    };
  const codes = [
    "P1000",
    "P1001",
    "P1002",
    "P1003",
    "P1008",
    "P1009",
    "P1010",
    "P1011",
    "P1012",
    "P1013",
    "P1014",
    "P1015",
    "P1016",
    "P1017",
    "P4001",
    "P4002",
  ];
  const output = result.stdout + result.stderr;
  const prismaCode = codes.find((code) => new RegExp(String.raw`\b${code}\b`).test(output)) ?? null;
  if (result.status === 2) {
    let approvedSql = false;
    try {
      approvedSql = assertProductionSchemaDiff(result.stdout) > 0;
    } catch {
      /* Only the boolean is safe to log. */
    }
    return {
      result: "SCHEMA_DIFF_PRESENT",
      exitCode,
      prismaCode,
      approvedSql,
      connectionMode: "NORMAL_REPO_CONFIG",
    };
  }
  if (result.status === 0 && result.stdout.trim() === "-- This is an empty migration.") {
    return {
      result: "SCHEMA_UP_TO_DATE",
      exitCode,
      prismaCode,
      connectionMode: "NORMAL_REPO_CONFIG",
    };
  }
  return { result: "CLI_FAILURE", exitCode, prismaCode, connectionMode: "NORMAL_REPO_CONFIG" };
}

try {
  console.log(`FOREWORD_READ_ONLY_DIAG ${JSON.stringify(diagnoseProductionDiff())}`);
} catch (error) {
  console.log(
    `FOREWORD_READ_ONLY_DIAG ${JSON.stringify({ result: "DIAGNOSTIC_SETUP_FAILURE", errorCode: diagnosticErrorCode(error), errorClass: diagnosticErrorClass(error) })}`,
  );
}
// Never import the normal runner, push schemas, build the app, or emit deployment output.
