import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

const roots: Array<string> = [];
const emptyDiff = "-- This is an empty migration.\n";
const secret = "postgresql://canary:do-not-print@invalid/database";
const allowedSql = readFileSync(new URL("productionSchemaChanges.sql", import.meta.url), "utf8");

interface Props {
  environment: string | null;
  databaseUrl: string | null;
  before: string;
  after: string;
  failure: string | null;
}

function runBuild({ environment, databaseUrl, before, after, failure }: Props) {
  const root = mkdtempSync(path.join(tmpdir(), "foreword-build-"));
  roots.push(root);
  mkdirSync(path.join(root, "node_modules"));
  symlinkSync(
    fileURLToPath(new URL("../node_modules/zod", import.meta.url)),
    path.join(root, "node_modules/zod"),
  );
  cpSync(new URL("./", import.meta.url), path.join(root, "scripts"), { recursive: true });
  cpSync(new URL("../vercel.json", import.meta.url), path.join(root, "vercel.json"));
  mkdirSync(path.join(root, "bin"));
  const fakePnpm = path.join(root, "bin/pnpm");
  writeFileSync(
    fakePnpm,
    String.raw`#!${process.execPath}
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const log = "commands.jsonl";
appendFileSync(log, JSON.stringify(args) + "\n");
let step;
if (args.includes("diff")) step = existsSync("pushed") ? "after" : "before";
else if (args.includes("push")) step = "push";
else if (args.includes("productionRowCounts.mjs") || args.some((arg) => arg.endsWith("/productionRowCounts.mjs"))) step = "counts";
else if (args.join(" ") === "--filter web build") step = "build";
else process.exit(90);
if (process.env.FAILURE === step) {
  console.log(process.env.DATABASE_URL);
  console.error(process.env.DATABASE_URL);
  process.exit(1);
}
if (step === "before" || step === "after") {
  const sql = process.env[step.toUpperCase()] ?? "";
  process.stdout.write(sql);
  process.exit(sql.includes("ALTER ") || sql.includes("CREATE ") || sql.includes("DROP ") ? 2 : 0);
}
if (step === "counts") console.log(JSON.stringify({vocabulary_candidate:"12", vocab_card_video:"3", study_review:"42"}));
if (step === "push") writeFileSync("pushed", "yes");
if (step === "build") {
  mkdirSync("apps/web/.vercel/output/functions", {recursive:true});
  writeFileSync("apps/web/.vercel/output/config.json", '{"version":3}');
}
`,
    { mode: 0o755 },
  );
  const config = z
    .object({ buildCommand: z.string() })
    .parse(JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8")));
  expect(config.buildCommand).toBe("node scripts/vercelBuild.mjs");
  const env: NodeJS.ProcessEnv = {
    PATH: `${path.join(root, "bin")}:${process.env.PATH ?? "/usr/bin:/bin"}`,
    BEFORE: before,
    AFTER: after,
  };
  if (environment != null) env.VERCEL_ENV = environment;
  if (databaseUrl != null) env.DATABASE_URL = databaseUrl;
  if (failure != null) env.FAILURE = failure;
  const result = spawnSync(process.execPath, ["scripts/vercelBuild.mjs"], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  const commands = readFileSync(path.join(root, "commands.jsonl"), { encoding: "utf8", flag: "a+" })
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => z.array(z.string()).parse(JSON.parse(line)));
  return { root, result, commands, output: result.stdout + result.stderr };
}

const production: Props = {
  environment: "production",
  databaseUrl: secret,
  before: allowedSql,
  after: emptyDiff,
  failure: null,
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("effective Vercel build", () => {
  it("preserves Prisma's diff exit code through the real pnpm wrapper", () => {
    const env = {
      PATH: process.env.PATH,
      HOME: "/home/box",
      COREPACK_HOME: "/home/box/.cache/corepack",
    };
    const args = ["exec", process.execPath, "-e", "process.exit(2)"];
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- Exercise the installed pnpm wrapper, not a mock.
    const wrapped = spawnSync("pnpm", ["--filter", "@app-template/db", ...args], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env,
      encoding: "utf8",
    });
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- Exercise the installed pnpm wrapper, not a mock.
    const fixed = spawnSync("pnpm", ["--dir", "packages/db", ...args], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env,
      encoding: "utf8",
    });
    expect(wrapped.status).toBe(1);
    expect(fixed.status).toBe(2);
    const build = runBuild(production);
    expect(build.commands[0]?.slice(0, 4)).toEqual(["--dir", "packages/db", "exec", "prisma"]);
    expect(build.result.status).toBe(0);
  });

  it("uses the production schema gate before building the app", () => {
    const config = z
      .object({ buildCommand: z.string() })
      .parse(JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")));
    expect(config.buildCommand).toBe("node scripts/vercelBuild.mjs");
  });

  it.each([null, "preview", "development", "Production", "production "])(
    "skips every DB command for %s",
    (environment) => {
      const { commands, result, root } = runBuild({
        ...production,
        environment,
        databaseUrl: null,
      });
      expect(result.status).toBe(0);
      expect(commands).toEqual([["--filter", "web", "build"]]);
      expect(
        JSON.parse(readFileSync(path.join(root, ".vercel/output/config.json"), "utf8")),
      ).toEqual({ version: 3 });
    },
  );

  it.each([null, "", "   "])(
    "fails before any command when production URL is %s",
    (databaseUrl) => {
      const { commands, result } = runBuild({ ...production, databaseUrl });
      expect(result.status).toBe(1);
      expect(commands).toEqual([]);
    },
  );

  it("diffs, counts, pushes without destructive flags, verifies, then builds and packages", () => {
    const { commands, result, output, root } = runBuild(production);
    expect(result.status).toBe(0);
    expect(commands.map((command) => command.slice(3, 5))).toEqual([
      ["prisma", "migrate"],
      ["node", "scripts/productionRowCounts.mjs"],
      ["prisma", "db"],
      ["prisma", "migrate"],
      [],
    ]);
    expect(commands[2]).toEqual([
      "--dir",
      "packages/db",
      "exec",
      "prisma",
      "db",
      "push",
      "--config",
      "prisma.production.config.mjs",
    ]);
    expect(output).toContain("vocabulary_candidate rows=12");
    expect(output).toContain("vocab_card_video rows=3");
    expect(output).toContain("study_review rows=42");
    expect(output).not.toContain(secret);
    expect(JSON.parse(readFileSync(path.join(root, ".vercel/output/config.json"), "utf8"))).toEqual(
      { version: 3 },
    );
  });

  it("builds without pushing if the schema is already current", () => {
    const { commands, result } = runBuild({ ...production, before: emptyDiff });
    expect(result.status).toBe(0);
    expect(commands).toHaveLength(2);
    expect(commands[1]).toEqual(["--filter", "web", "build"]);
  });

  it.each(["before", "counts", "push", "after"])(
    "stops on %s failure and suppresses DB output",
    (failure) => {
      const { commands, result, output } = runBuild({ ...production, failure });
      expect(result.status).toBe(1);
      expect(commands).not.toContainEqual(["--filter", "web", "build"]);
      expect(output).not.toContain(secret);
    },
  );

  it.each([
    'DROP TABLE "study_review";',
    'ALTER TABLE "study_review" DROP COLUMN "result";',
    'CREATE TABLE "unknown" (id TEXT);',
    "",
    "-- unrecognized empty result",
  ])("rejects unexpected or invalid diff %s", (before) => {
    const { commands, result } = runBuild({ ...production, before });
    expect(result.status).toBe(1);
    expect(commands).toHaveLength(1);
  });

  it("fails if the schema still differs after a successful push", () => {
    const { commands, result } = runBuild({ ...production, after: allowedSql });
    expect(result.status).toBe(1);
    expect(commands).toHaveLength(4);
  });

  it("does not package output after an app-build failure", () => {
    const { result, root } = runBuild({
      ...production,
      environment: "preview",
      databaseUrl: null,
      failure: "build",
    });
    expect(result.status).toBe(1);
    expect(() => readFileSync(path.join(root, ".vercel/output/config.json"))).toThrow();
  });

  it("uses an explicit DB config with no dotenv fallback", () => {
    const config = new URL("../packages/db/prisma.production.config.mjs", import.meta.url);
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const {default: config} = await import(${JSON.stringify(config.href)}); console.log(JSON.stringify(config));`,
      ],
      { env: {}, encoding: "utf8" },
    );
    expect(z.object({ datasource: z.object({}) }).parse(JSON.parse(output)).datasource).toEqual({});
  });
});

describe("production row counts", () => {
  it.each([false, true])(
    "uses read-only aggregate queries and hides connection failures (%s)",
    (failConnection) => {
      const root = mkdtempSync(path.join(tmpdir(), "foreword-counts-"));
      roots.push(root);
      const modules = path.join(root, "node_modules");
      mkdirSync(path.join(modules, "pg"), { recursive: true });
      symlinkSync(
        fileURLToPath(new URL("../node_modules/zod", import.meta.url)),
        path.join(modules, "zod"),
      );
      cpSync(
        new URL("../packages/db/scripts/productionRowCounts.mjs", import.meta.url),
        path.join(root, "productionRowCounts.mjs"),
      );
      writeFileSync(
        path.join(modules, "pg/package.json"),
        JSON.stringify({ type: "module", exports: "./index.js" }),
      );
      writeFileSync(
        path.join(modules, "pg/index.js"),
        String.raw`
import { appendFileSync } from "node:fs";
export class Client {
  async connect() {
    if (process.env.FAIL_CONNECTION === "yes") throw new Error(process.env.DATABASE_URL);
  }
  async query(sql) {
    appendFileSync("queries.jsonl", JSON.stringify(sql) + "\n");
    return { rows: [{ vocabulary_candidate: "12", vocab_card_video: "3", study_review: "42" }] };
  }
  async end() {}
}
`,
      );
      const result = spawnSync(process.execPath, ["productionRowCounts.mjs"], {
        cwd: root,
        encoding: "utf8",
        env: {
          VERCEL_ENV: "production",
          DATABASE_URL: secret,
          FAIL_CONNECTION: failConnection ? "yes" : "no",
        },
      });
      expect(result.status).toBe(failConnection ? 1 : 0);
      expect(result.stdout + result.stderr).not.toContain(secret);
      if (!failConnection) {
        expect(JSON.parse(result.stdout)).toEqual({
          vocabulary_candidate: "12",
          vocab_card_video: "3",
          study_review: "42",
        });
        const queries = readFileSync(path.join(root, "queries.jsonl"), "utf8")
          .trim()
          .split("\n")
          .map((line) => z.string().parse(JSON.parse(line)));
        expect(queries[0]).toBe("BEGIN READ ONLY");
        expect(queries[1]).toContain('count(*)::text FROM "vocabulary_candidate"');
        expect(queries[1]).toContain('count(*)::text FROM "vocab_card_video"');
        expect(queries[1]).toContain('count(*)::text FROM "study_review"');
        expect(queries[2]).toBe("COMMIT");
      }
    },
  );
});
