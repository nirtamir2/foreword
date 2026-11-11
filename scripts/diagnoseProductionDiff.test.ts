import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { z } from "zod";

const roots: Array<string> = [];
const secret = "postgresql://canary:never-log@invalid/private";
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it.each([
  {
    environment: "preview",
    url: secret,
    code: 2,
    output: "",
    expected: "NOT_PRODUCTION",
    called: false,
  },
  {
    environment: "production",
    url: "",
    code: 2,
    output: "",
    expected: "DATABASE_URL_MISSING",
    called: false,
  },
  {
    environment: "production",
    url: secret,
    code: 2,
    output: "ALTER TYPE \"CandidateStatus\" ADD VALUE 'UNRESOLVED';",
    expected: "SCHEMA_DIFF_PRESENT",
    called: true,
  },
  {
    environment: "production",
    url: secret,
    code: 1,
    output: `P1001 ${secret}`,
    expected: "CLI_FAILURE",
    called: true,
  },
  {
    environment: "production",
    url: secret,
    code: 0,
    output: "-- This is an empty migration.",
    expected: "SCHEMA_UP_TO_DATE",
    called: true,
  },
  {
    environment: "production",
    url: secret,
    code: 0,
    output: secret,
    expected: "CLI_FAILURE",
    called: true,
  },
  {
    environment: "production",
    url: secret,
    code: 2,
    output: 'DROP TABLE "study_review";',
    expected: "SCHEMA_DIFF_PRESENT",
    called: true,
  },
  {
    environment: "production",
    url: secret,
    code: 1,
    output: "CLI_SIGNAL",
    expected: "CLI_PROCESS_FAILURE",
    called: true,
  },
])(
  "always fails closed with safe classification: $expected",
  ({ environment, url, code, output, expected, called }) => {
    const root = mkdtempSync(path.join(tmpdir(), "foreword-read-only-"));
    roots.push(root);
    const scripts = path.join(root, "scripts");
    mkdirSync(scripts);
    for (const name of [
      "diagnoseProductionDiff.mjs",
      "summarizeProductionSchemaDiff.mjs",
      "assertProductionSchemaDiff.mjs",
      "productionSchemaChanges.sql",
    ]) {
      cpSync(new URL(name, import.meta.url), path.join(scripts, name));
    }
    const db = path.join(root, "packages/db");
    mkdirSync(path.join(db, "node_modules/prisma/build"), { recursive: true });
    writeFileSync(path.join(db, "package.json"), "{}");
    mkdirSync(path.join(db, "scripts"));
    cpSync(
      new URL("../packages/db/scripts/diagnosticErrorCode.mjs", import.meta.url),
      path.join(db, "scripts/diagnosticErrorCode.mjs"),
    );
    cpSync(
      new URL("../packages/db/scripts/diagnosticErrorClass.mjs", import.meta.url),
      path.join(db, "scripts/diagnosticErrorClass.mjs"),
    );
    cpSync(
      new URL("../packages/db/prisma.production.config.mjs", import.meta.url),
      path.join(db, "prisma.production.config.mjs"),
    );
    mkdirSync(path.join(db, "prisma/schema"), { recursive: true });
    cpSync(
      new URL("../packages/db/prisma/schema/", import.meta.url),
      path.join(db, "prisma/schema"),
      { recursive: true },
    );
    writeFileSync(
      path.join(db, "prisma.diagnostic.config.mjs"),
      'throw new Error("STARTUP_CONFIG_MUST_NOT_LOAD");',
    );
    writeFileSync(
      path.join(db, "scripts/checkDiagnosticReadOnlySession.mjs"),
      'throw new Error("SESSION_GUARD_MUST_NOT_RUN");',
    );
    writeFileSync(
      path.join(scripts, "vercelBuild.mjs"),
      'throw new Error("NORMAL_RUNNER_MUST_NOT_LOAD");',
    );
    writeFileSync(path.join(db, ".env"), "DATABASE_URL=unused-local-fallback\n");

    writeFileSync(
      path.join(db, "node_modules/prisma/package.json"),
      JSON.stringify({ exports: { "./build/index.js": "./build/index.js" } }),
    );
    writeFileSync(
      path.join(db, "node_modules/prisma/build/index.js"),
      `
    (async () => {
      const args = process.argv.slice(2);
      require("node:fs").writeFileSync("args.json", JSON.stringify(args));
      const {default: config} = await import(require("node:url").pathToFileURL(args[args.indexOf("--config")+1]).href);
      require("node:fs").writeFileSync("normal-config.json", JSON.stringify({unchanged:config.datasource.url===process.env.DATABASE_URL}));
      process.stderr.write(${JSON.stringify(secret)});
      if (${JSON.stringify(output)} === "CLI_SIGNAL") process.kill(process.pid,"SIGTERM");
      else { process.stdout.write(${JSON.stringify(output)}); process.exit(${code.toString()}); }
    })();
  `,
    );
    const result = spawnSync(process.execPath, [path.join(scripts, "diagnoseProductionDiff.mjs")], {
      cwd: root,
      env: { VERCEL_ENV: environment, DATABASE_URL: url },
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(secret);
    expect(result.stderr).toBe("");
    const diagnostic = z
      .object({ result: z.string(), prismaCode: z.string().nullable().optional() })
      .parse(
        JSON.parse(
          result.stdout
            .split("\n")
            .find((line) => line.startsWith("FOREWORD_READ_ONLY_DIAG "))
            ?.replace("FOREWORD_READ_ONLY_DIAG ", "") ?? "null",
        ),
      );
    expect(diagnostic.result).toBe(expected);
    if (output === "CLI_SIGNAL") expect(result.stdout).toContain('"signal":"SIGTERM"');
    if (output.startsWith("P1001")) expect(diagnostic.prismaCode).toBe("P1001");
    if (called) {
      const args = z
        .array(z.string())
        .parse(JSON.parse(readFileSync(path.join(db, "args.json"), "utf8")));
      expect(args).toEqual([
        "migrate",
        "diff",
        "--config",
        path.join(db, "prisma.production.config.mjs"),
        "--from-config-datasource",
        "--to-schema",
        path.join(db, "prisma/schema"),
        "--script",
        "--exit-code",
      ]);
      expect(JSON.parse(readFileSync(path.join(db, "normal-config.json"), "utf8"))).toEqual({
        unchanged: true,
      });
      if (output.startsWith("DROP")) expect(result.stdout).toContain('"approvedSql":false');
    } else expect(() => readFileSync(path.join(db, "args.json"))).toThrow();
    expect(() => readFileSync(path.join(root, ".vercel/output/config.json"))).toThrow();
  },
);

it("makes the effective Vercel entrypoint diagnostic only", () => {
  const config = z
    .object({ buildCommand: z.string() })
    .parse(JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")));
  expect(config.buildCommand).toBe("node scripts/diagnoseProductionDiff.mjs");
});

it("disables installation hooks and strips database credentials before pnpm runs", () => {
  const root = mkdtempSync(path.join(tmpdir(), "foreword-install-"));
  roots.push(root);
  mkdirSync(path.join(root, "scripts"));
  mkdirSync(path.join(root, "bin"));
  cpSync(
    new URL("installDiagnosticDependencies.mjs", import.meta.url),
    path.join(root, "scripts/installDiagnosticDependencies.mjs"),
  );
  writeFileSync(
    path.join(root, "bin/pnpm"),
    `#!${process.execPath}
require("node:fs").writeFileSync("install.json", JSON.stringify({args:process.argv.slice(2),hasDatabaseUrl:process.env.DATABASE_URL != null,hasProviderKey:process.env.PROVIDER_KEY != null}));
`,
    { mode: 0o755 },
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/installDiagnosticDependencies.mjs")],
    {
      cwd: root,
      env: { PATH: path.join(root, "bin"), DATABASE_URL: secret, PROVIDER_KEY: secret },
      encoding: "utf8",
    },
  );
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).not.toContain(secret);
  expect(JSON.parse(readFileSync(path.join(root, "install.json"), "utf8"))).toEqual({
    args: ["install", "--frozen-lockfile", "--ignore-scripts", "--ignore-pnpmfile"],
    hasDatabaseUrl: false,
    hasProviderKey: false,
  });
  const config = z
    .object({ installCommand: z.string() })
    .parse(JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")));
  expect(config.installCommand).toBe("node scripts/installDiagnosticDependencies.mjs");
});

it.each([
  { stage: "IMPORT_PG", code: "ERR_MODULE_NOT_FOUND", name: "Error" },
  { stage: "LOAD_CONFIG", code: "ERR_INVALID_URL", name: "TypeError" },
  { stage: "CREATE_CLIENT", code: "ERR_INVALID_ARG_TYPE", name: "TypeError" },
  { stage: "CONNECT", code: "DEPTH_ZERO_SELF_SIGNED_CERT", name: "Error" },
  { stage: "CONNECT", code: "ENOTFOUND", name: "Error" },
  { stage: "SHOW_DEFAULT_READ_ONLY", code: "08P01", name: "Error" },
  { stage: "SHOW_TRANSACTION_READ_ONLY", code: "42501", name: "Error" },
  { stage: "CLOSE", code: "ECONNRESET", name: "Error" },
])("sanitizes real child failures at $stage: $code", ({ stage, code, name }) => {
  const root = mkdtempSync(path.join(tmpdir(), "foreword-child-error-"));
  roots.push(root);
  const db = path.join(root, "db");
  mkdirSync(path.join(db, "scripts"), { recursive: true });
  for (const file of [
    "checkDiagnosticReadOnlySession.mjs",
    "diagnosticErrorCode.mjs",
    "diagnosticErrorClass.mjs",
  ]) {
    cpSync(
      new URL(`../packages/db/scripts/${file}`, import.meta.url),
      path.join(db, "scripts", file),
    );
  }
  const errorSource = `throw Object.assign(new ${name}(${JSON.stringify(secret)}), {code:${JSON.stringify(code)}});`;
  writeFileSync(
    path.join(db, "prisma.diagnostic.config.mjs"),
    stage === "LOAD_CONFIG" ? errorSource : 'export default {datasource:{url:"unused"}};',
  );
  if (stage !== "IMPORT_PG") {
    mkdirSync(path.join(db, "node_modules/pg"), { recursive: true });
    writeFileSync(
      path.join(db, "node_modules/pg/package.json"),
      JSON.stringify({ type: "module", exports: "./index.js" }),
    );
    writeFileSync(
      path.join(db, "node_modules/pg/index.js"),
      `export class Client {
      constructor() { ${stage === "CREATE_CLIENT" ? errorSource : ""} }
      async connect() { ${stage === "CONNECT" ? errorSource : ""} }
      async query(sql) {
        if (sql === "SHOW default_transaction_read_only") { ${stage === "SHOW_DEFAULT_READ_ONLY" ? errorSource : ""} return {rows:[{default_transaction_read_only:"on"}]}; }
        ${stage === "SHOW_TRANSACTION_READ_ONLY" ? errorSource : ""}
        return {rows:[{transaction_read_only:"on"}]};
      }
      async end() { ${stage === "CLOSE" ? errorSource : ""} }
    }`,
    );
  }
  const result = spawnSync(
    process.execPath,
    [path.join(db, "scripts/checkDiagnosticReadOnlySession.mjs")],
    { env: {}, encoding: "utf8" },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toBe("");
  expect(result.stdout).not.toContain(secret);
  expect(JSON.parse(result.stdout)).toEqual({ stage, code, name });
});
