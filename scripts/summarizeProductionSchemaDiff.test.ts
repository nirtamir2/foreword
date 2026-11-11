import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { summarizeProductionSchemaDiff } from "./summarizeProductionSchemaDiff.mjs";

const databaseUrl =
  "postgresql://never-print:never-print@invalid/private?schema=private_schema_canary";
const canary = "PRIVATE_DEFAULT_CANARY";
const expected = readFileSync(new URL("productionSchemaChanges.sql", import.meta.url), "utf8");

it("recognizes every reviewed statement without echoing enum/default values", () => {
  const summary = summarizeProductionSchemaDiff({ sql: expected, databaseUrl });
  expect(summary.statementCount).toBe(5);
  expect(summary.statements.every((statement) => statement.strictReviewed)).toBe(true);
  expect(JSON.stringify(summary)).not.toContain("UNRESOLVED");
  expect(JSON.stringify(summary)).not.toContain("private_schema_canary");
  expect(JSON.stringify(summary)).not.toContain("never-print");
  expect(summary.schemaAlignment).toBe("UNVERIFIED");
});

it("reports unexpected structural changes and hashes unknown identifiers", () => {
  const summary = summarizeProductionSchemaDiff({
    sql: 'ALTER TABLE "public"."study_review" DROP COLUMN "clientAnswerId"; DROP TABLE "PRIVATE_TABLE_CANARY";',
    databaseUrl,
  });
  expect(summary.statementCount).toBe(2);
  expect(summary.statements[0]).toMatchObject({
    operation: "ALTER TABLE",
    actions: ["DROP COLUMN"],
    strictReviewed: false,
    reason: "UNREVIEWED_STRUCTURE",
  });
  expect(summary.statements[0]?.identifiers).toEqual([
    { known: "public" },
    { known: "study_review" },
    { known: "clientAnswerId" },
  ]);
  expect(summary.statements[1]).toMatchObject({ operation: "DROP TABLE", strictReviewed: false });
  expect(JSON.stringify(summary)).not.toContain("PRIVATE_TABLE_CANARY");
});

it.each([
  `'${canary}; DROP TABLE "book"; ''quoted'' '`,
  `E'${canary}\\\'; DROP TABLE "book";'`,
  `$$${canary}; DROP TABLE "book";$$`,
  `$tag$${canary}; -- comment\n DROP TABLE "book";$tag$`,
])("keeps literal bodies opaque", (literal) => {
  const summary = summarizeProductionSchemaDiff({
    sql: `ALTER TABLE "study_review" ALTER COLUMN "clientAnswerId" SET DEFAULT ${literal};`,
    databaseUrl,
  });
  expect(summary.statementCount).toBe(1);
  expect(summary.statements[0]?.identifiers).toEqual([
    { known: "study_review" },
    { known: "clientAnswerId" },
  ]);
  expect(summary.statements[0]?.actions).toContain("SET DEFAULT");
  expect(summary.statements[0]?.actions).not.toContain("DROP TABLE");
  expect(JSON.stringify(summary)).not.toContain(canary);
});

it("ignores nested comments and inline comments", () => {
  const summary = summarizeProductionSchemaDiff({
    sql: `/* ${canary} /* nested ; */ end */ DROP /* ${canary} */ TABLE "study_review"; -- ${canary}`,
    databaseUrl,
  });
  expect(summary.statementCount).toBe(1);
  expect(summary.statements[0]?.operation).toBe("DROP TABLE");
  expect(JSON.stringify(summary)).not.toContain(canary);
});

it("distinguishes strict literal differences without publishing the changed value or its hash", () => {
  const first = summarizeProductionSchemaDiff({
    sql: expected.replace("DEFAULT 0", "DEFAULT 999999"),
    databaseUrl,
  });
  const second = summarizeProductionSchemaDiff({
    sql: expected.replace("DEFAULT 0", "DEFAULT 888888"),
    databaseUrl,
  });
  expect(
    first.statements.some(
      (statement) => statement.reason === "REVIEWED_SHAPE_TEXT_OR_LITERAL_DIFFERS",
    ),
  ).toBe(true);
  expect(first).toEqual(second);
  expect(JSON.stringify(first)).not.toContain("999999");
});

it.each(["'unclosed", "$tag$unclosed", '"unclosed', "/* unclosed", String.raw`'ambiguous\' `])(
  "rejects ambiguous lexing safely",
  (sql) => {
    expect(summarizeProductionSchemaDiff({ sql, databaseUrl })).toEqual({
      reason: "LEXICAL_REJECTED",
      statementCount: null,
      statements: [],
    });
  },
);

it("bounds the result and never prints unquoted free text", () => {
  const summary = summarizeProductionSchemaDiff({
    sql: `ALTER TABLE PRIVATE_IDENTIFIER_CANARY DROP COLUMN private_column_canary;`.repeat(80),
    databaseUrl,
  });
  expect(summary.statementCount).toBe(80);
  expect(summary.statements).toHaveLength(64);
  expect(summary.truncated).toBe(true);
  expect(JSON.stringify(summary)).not.toContain("PRIVATE_IDENTIFIER_CANARY");
  expect(JSON.stringify(summary)).not.toContain("private_column_canary");
});
