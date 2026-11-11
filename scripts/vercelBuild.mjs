import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { assertProductionSchemaDiff } from "./assertProductionSchemaDiff.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const prisma = ["--filter", "@app-template/db", "exec", "prisma"];
const config = ["--config", "prisma.production.config.mjs"];

/** @param {{ args: string[], step: string, successCodes?: number[] }} input */
function databaseCommand({ args, step, successCodes = [0] }) {
  // Vercel installs pnpm in its build PATH. No command comes from request input.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  const result = spawnSync("pnpm", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
  });
  // Prisma may include connection strings in errors or datasource banners.
  if (result.error != null || result.status == null || !successCodes.includes(result.status)) {
    throw new Error(`${step} failed. Database output suppressed. App build stopped.`);
  }
  return result;
}

function diff() {
  const result = databaseCommand({
    args: [
      ...prisma,
      "migrate",
      "diff",
      ...config,
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema",
      "--script",
      "--exit-code",
    ],
    step: "Production schema diff",
    successCodes: [0, 2],
  });
  const changes = assertProductionSchemaDiff(result.stdout);
  if (
    (result.status === 0 && result.stdout.trim() !== "-- This is an empty migration.") ||
    (result.status === 2 && changes === 0)
  ) {
    throw new Error("Production schema diff returned an invalid result. App build stopped.");
  }
  return changes;
}

try {
  if (process.env.VERCEL_ENV === "production") {
    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error("Production DATABASE_URL is required. App build stopped.");
    }
    const changes = diff();
    if (changes > 0) {
      console.log(`Reviewed production schema changes: ${changes} SQL statements.`);
      const counts = z.record(z.string(), z.string().regex(/^\d+$/)).parse(
        JSON.parse(
          databaseCommand({
            args: [
              "--filter",
              "@app-template/db",
              "exec",
              "node",
              "scripts/productionRowCounts.mjs",
            ],
            step: "Production row counts",
          }).stdout,
        ),
      );
      for (const table of ["vocabulary_candidate", "vocab_card_video", "study_review"]) {
        if (typeof counts[table] !== "string" || !/^\d+$/.test(counts[table])) {
          throw new Error("Production row counts were invalid. App build stopped.");
        }
        console.log(`Before schema push: ${table} rows=${counts[table]}`);
      }
      databaseCommand({
        args: [...prisma, "db", "push", ...config],
        step: "Production schema push",
      });
      if (diff() !== 0) {
        throw new Error("Production schema still differs after push. App build stopped.");
      }
      console.log("Production schema verified after push.");
    } else {
      console.log("Production schema is already up to date.");
    }
  } else {
    console.log("Skipping database rollout outside VERCEL_ENV=production.");
  }
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- Vercel supplies the pnpm executable.
  const build = spawnSync("pnpm", ["--filter", "web", "build"], { cwd: root, stdio: "inherit" });
  if (build.error != null || build.status !== 0) {
    throw new Error("App build failed.");
  }
  rmSync(new URL("../.vercel/output", import.meta.url), { recursive: true, force: true });
  mkdirSync(new URL("../.vercel", import.meta.url), { recursive: true });
  renameSync(
    new URL("../apps/web/.vercel/output", import.meta.url),
    new URL("../.vercel/output", import.meta.url),
  );
} catch (error) {
  // Never forward arbitrary child-process errors or database responses.
  const message =
    !(error instanceof Error) || error instanceof SyntaxError
      ? "Invalid database check response. App build stopped."
      : error.message;
  console.error(message);
  process.exitCode = 1;
}
