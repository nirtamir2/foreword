import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { diagnosticErrorClass } from "../packages/db/scripts/diagnosticErrorClass.mjs";
import { diagnosticErrorCode } from "../packages/db/scripts/diagnosticErrorCode.mjs";
import { assertProductionSchemaDiff } from "./assertProductionSchemaDiff.mjs";

// This branch is diagnostic only. A successful diagnostic must still fail the Vercel build.
process.exitCode = 1;

async function diagnoseProductionDiff() {
  if (process.env.VERCEL_ENV !== "production") return { result: "NOT_PRODUCTION" };
  if (!process.env.DATABASE_URL?.trim()) return { result: "DATABASE_URL_MISSING" };
  const require = createRequire(new URL("../packages/db/package.json", import.meta.url));
  const session = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL("../packages/db/scripts/checkDiagnosticReadOnlySession.mjs", import.meta.url),
      ),
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 4096,
    },
  );
  if (
    session.error != null ||
    session.status !== 0 ||
    session.stdout.trim() !== "FOREWORD_SESSION_READ_ONLY"
  ) {
    let sessionCode = diagnosticErrorCode(session.error);
    let sessionClass = diagnosticErrorClass(session.error);
    let sessionStage = "CHILD_BOOTSTRAP";
    const stages = new Set([
      "IMPORT_PG",
      "LOAD_CONFIG",
      "CREATE_CLIENT",
      "CONNECT",
      "SHOW_DEFAULT_READ_ONLY",
      "SHOW_TRANSACTION_READ_ONLY",
      "VERIFY_SESSION",
      "CLOSE",
    ]);
    try {
      /** @type {unknown} */
      const details = JSON.parse(session.stdout);
      sessionCode = diagnosticErrorCode(details);
      sessionClass = diagnosticErrorClass(details);
      if (
        details != null &&
        typeof details === "object" &&
        "stage" in details &&
        typeof details.stage === "string" &&
        stages.has(details.stage)
      )
        sessionStage = details.stage;
    } catch {
      /* No raw session output is safe to forward. */
    }
    const sessionExitCode =
      session.status != null && [0, 1, 2].includes(session.status) ? session.status : null;
    const signals = new Set(["SIGTERM", "SIGKILL", "SIGABRT", "SIGSEGV", "SIGINT"]);
    const sessionSignal =
      session.signal != null && signals.has(session.signal) ? session.signal : null;
    return {
      result: "READ_ONLY_SESSION_NOT_VERIFIED",
      sessionCode,
      sessionClass,
      sessionStage,
      sessionExitCode,
      sessionSignal,
    };
  }

  const result = spawnSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "diff",
      "--config",
      fileURLToPath(new URL("../packages/db/prisma.diagnostic.config.mjs", import.meta.url)),
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
  const exitCode =
    result.status != null && [0, 1, 2].includes(result.status) ? result.status : null;
  if (result.error != null && "code" in result.error && result.error.code === "ETIMEDOUT")
    return { result: "CLI_TIMEOUT", exitCode };
  if (result.error != null || result.status == null)
    return { result: "CLI_PROCESS_FAILURE", exitCode };
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
      readOnlySessionVerified: true,
    };
  }
  if (result.status === 0 && result.stdout.trim() === "-- This is an empty migration.") {
    return { result: "SCHEMA_UP_TO_DATE", exitCode, prismaCode, readOnlySessionVerified: true };
  }
  return { result: "CLI_FAILURE", exitCode, prismaCode, readOnlySessionVerified: true };
}

try {
  console.log(`FOREWORD_READ_ONLY_DIAG ${JSON.stringify(await diagnoseProductionDiff())}`);
} catch {
  console.log('FOREWORD_READ_ONLY_DIAG {"result":"DIAGNOSTIC_SETUP_FAILURE"}');
}
// Never import the normal runner, push schemas, build the app, or emit deployment output.
