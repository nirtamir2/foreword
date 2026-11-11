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
    output: "SESSION_OFF",
    expected: "READ_ONLY_SESSION_NOT_VERIFIED",
    called: false,
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
    writeFileSync(
      path.join(db, "scripts/checkDiagnosticReadOnlySession.mjs"),
      `console.log(${JSON.stringify(output === "SESSION_OFF" ? "FOREWORD_SESSION_NOT_READ_ONLY" : "FOREWORD_SESSION_READ_ONLY")});`,
    );

    writeFileSync(
      path.join(db, "node_modules/prisma/package.json"),
      JSON.stringify({ exports: { "./build/index.js": "./build/index.js" } }),
    );
    writeFileSync(
      path.join(db, "node_modules/prisma/build/index.js"),
      `
    require("node:fs").writeFileSync("args.json", JSON.stringify(process.argv.slice(2)));
    process.stdout.write(${JSON.stringify(output)});
    process.stderr.write(${JSON.stringify(secret)});
    process.exit(${code.toString()});
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
      .parse(JSON.parse(result.stdout.trim().replace("FOREWORD_READ_ONLY_DIAG ", "")));
    expect(diagnostic.result).toBe(expected);
    if (output.startsWith("P1001")) expect(diagnostic.prismaCode).toBe("P1001");
    if (called) {
      const args = z
        .array(z.string())
        .parse(JSON.parse(readFileSync(path.join(db, "args.json"), "utf8")));
      expect(args.slice(0, 2)).toEqual(["migrate", "diff"]);
      expect(args).toContain("--from-config-datasource");
      expect(args).not.toContain("push");
      expect(args).not.toContain("build");
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
