import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { assertProductionSchemaDiff } from "./assertProductionSchemaDiff.mjs";

const modelPattern = /^(?:model|enum) +(\w+)/;
const fieldPattern = /^[ \t]{2}(\w+)[ \t]+\S/;
const mapPattern = /@map\("([^"]+)"\)/g;
const whitespacePattern = /\s/;
const dollarPattern = /^\$(?:[a-z_]\w*)?\$/i;
const wordPattern = /^[a-z_][\w$]*/i;
const numberPattern = /^\d+(?:\.\d+)?(?:e[+-]?\d+)?/i;
const known = new Set(["public"]);
for (const file of readdirSync(new URL("../packages/db/prisma/schema/", import.meta.url))) {
  if (!file.endsWith(".prisma")) continue;
  const schema = readFileSync(
    new URL(`../packages/db/prisma/schema/${file}`, import.meta.url),
    "utf8",
  );
  for (const line of schema.split("\n")) {
    for (const pattern of [modelPattern, fieldPattern]) {
      const name = pattern.exec(line)?.[1];
      if (name != null) known.add(name);
    }
    for (const match of line.matchAll(mapPattern)) if (match[1] != null) known.add(match[1]);
  }
}
const keywords = new Set(
  "ALTER TABLE TYPE CREATE UNIQUE INDEX DROP SCHEMA ADD COLUMN CONSTRAINT SET DEFAULT NOT NULL RENAME TO ON ONLY IF EXISTS CASCADE RESTRICT USING AS INTEGER TEXT TIMESTAMP DOUBLE PRECISION BOOLEAN JSONB PRIMARY KEY REFERENCES FOREIGN CHECK VALUE DATA WITH WITHOUT TIME ZONE DO FUNCTION SEQUENCE GENERATED ALWAYS IDENTITY".split(
    " ",
  ),
);

/** @param {string} value */
function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
/** @param {string} value */
function identifier(value) {
  return known.has(value) ? { known: value } : { hash: hash(`identifier:${value}`) };
}

/** @param {string} sql */
function tokenize(sql) {
  /** @type {{kind: string, value: string, end: number}[][]} */
  const statements = [];
  /** @type {{kind: string, value: string, end: number}[]} */
  let tokens = [];
  let i = 0;
  while (i < sql.length) {
    if (tokens.length > 10000 || statements.length > 512) throw new Error("LEXICAL_REJECTED");
    const start = i;
    const c = sql[i] ?? "";
    if (whitespacePattern.test(c)) {
      i++;
      continue;
    }
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i + 2);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql.startsWith("/*", i)) {
          depth++;
          i += 2;
        } else if (sql.startsWith("*/", i)) {
          depth--;
          i += 2;
        } else i++;
      }
      if (depth !== 0) throw new Error("LEXICAL_REJECTED");
      continue;
    }
    const dollar = c === "$" ? dollarPattern.exec(sql.slice(i))?.[0] : null;
    if (dollar != null) {
      const end = sql.indexOf(dollar, i + dollar.length);
      if (end === -1) throw new Error("LEXICAL_REJECTED");
      i = end + dollar.length;
      tokens.push({ kind: "literal", value: "DOLLAR_LITERAL", end: i });
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      let value = "";
      let closed = false;
      i++;
      while (i < sql.length) {
        if (sql[i] === quote && sql[i + 1] === quote) {
          value += quote;
          i += 2;
        } else if (sql[i] === quote) {
          i++;
          closed = true;
          break;
        } else if (quote === "'" && sql[i] === "\\") {
          const prefix = tokens.at(-1);
          if (prefix?.kind !== "word" || prefix.value.toUpperCase() !== "E" || prefix.end !== start)
            throw new Error("LEXICAL_REJECTED");
          i += 2;
        } else {
          if (quote === '"') value += sql[i];
          i++;
        }
      }
      if (!closed) throw new Error("LEXICAL_REJECTED");
      tokens.push({
        kind: quote === '"' ? "identifier" : "literal",
        value: quote === '"' ? value : "STRING_LITERAL",
        end: i,
      });
      continue;
    }
    if (c === ";") {
      i++;
      if (tokens.length > 0) {
        statements.push(tokens);
        tokens = [];
      }
      continue;
    }
    const word = wordPattern.exec(sql.slice(i))?.[0];
    if (word != null) {
      i += word.length;
      tokens.push({ kind: "word", value: word, end: i });
      continue;
    }
    const number = numberPattern.exec(sql.slice(i))?.[0];
    if (number != null) {
      i += number.length;
      tokens.push({ kind: "literal", value: "NUMBER_LITERAL", end: i });
      continue;
    }
    i++;
    tokens.push({ kind: "symbol", value: ".,()=+-".includes(c) ? c : "OPAQUE", end: i });
    if (i <= start) throw new Error("LEXICAL_REJECTED");
  }
  if (tokens.length > 0) statements.push(tokens);
  return statements;
}

/** @param {ReturnType<typeof tokenize>[number]} tokens */
function structure(tokens) {
  return tokens
    .map((token) => {
      if (token.kind === "identifier") return `ID:${JSON.stringify(identifier(token.value))}`;
      if (token.kind === "word") {
        const word = token.value.toUpperCase();
        if (["TRUE", "FALSE", "NULL"].includes(word)) return "LITERAL";
        return keywords.has(word) ? word : "OPAQUE_WORD";
      }
      return token.kind === "literal" ? "LITERAL" : token.value;
    })
    .join(" ");
}

/** @param {{sql: string, databaseUrl: string}} input */
export function summarizeProductionSchemaDiff({ sql, databaseUrl }) {
  if (sql.length > 1024 * 1024)
    return { reason: "INPUT_LIMIT", statementCount: null, statements: [] };
  try {
    const parsed = tokenize(sql);
    const reviewed = tokenize(
      readFileSync(new URL("productionSchemaChanges.sql", import.meta.url), "utf8"),
    );
    const shapes = new Set(reviewed.map((tokens) => hash(structure(tokens))));
    let previousEnd = 0;
    const statements = parsed.map((tokens) => {
      const end = tokens.at(-1)?.end ?? previousEnd;
      const raw = sql.slice(previousEnd, end);
      previousEnd = end;
      let strictReviewed = false;
      try {
        const candidate = raw.trimStart();
        strictReviewed =
          assertProductionSchemaDiff(candidate.startsWith(";") ? candidate.slice(1) : candidate) >
          0;
      } catch {
        /* Never log input or exception text. */
      }
      const words = tokens
        .filter((token) => token.kind === "word")
        .map((token) => token.value.toUpperCase());
      const operations = [
        "ALTER TABLE",
        "ALTER TYPE",
        "CREATE UNIQUE INDEX",
        "CREATE INDEX",
        "CREATE TABLE",
        "CREATE TYPE",
        "CREATE SCHEMA",
        "DROP TABLE",
        "DROP TYPE",
        "DROP INDEX",
        "DROP SCHEMA",
        "CREATE SEQUENCE",
        "ALTER SEQUENCE",
        "DROP SEQUENCE",
      ];
      const operation =
        operations.find(
          (candidate) => words.slice(0, candidate.split(" ").length).join(" ") === candidate,
        ) ?? "OTHER";
      const actions = [
        "ADD COLUMN",
        "DROP COLUMN",
        "ALTER COLUMN",
        "SET DEFAULT",
        "DROP DEFAULT",
        "SET NOT NULL",
        "DROP NOT NULL",
        "ADD CONSTRAINT",
        "DROP CONSTRAINT",
        "ADD VALUE",
        "RENAME TO",
        "DATA TYPE",
      ].filter((action) => words.join(" ").includes(action));
      const fingerprint = hash(structure(tokens));
      let reason = "UNREVIEWED_STRUCTURE";
      if (shapes.has(fingerprint)) reason = "REVIEWED_SHAPE_TEXT_OR_LITERAL_DIFFERS";
      if (strictReviewed) reason = "STRICTLY_REVIEWED";
      return {
        operation,
        actions,
        strictReviewed,
        reason,
        structureHash: fingerprint,
        identifiers: tokens
          .filter((token) => token.kind === "identifier")
          .slice(0, 32)
          .map((token) => identifier(token.value)),
        identifiersTruncated: tokens.filter((token) => token.kind === "identifier").length > 32,
        literalsRedacted: tokens.filter((token) => token.kind === "literal").length,
      };
    });
    /** @type {{present: boolean, public: boolean, hash: string | null}} */
    let cliSchemaParameter = { present: false, public: false, hash: null };
    try {
      const schema = new URL(databaseUrl).searchParams.get("schema");
      cliSchemaParameter = {
        present: schema != null,
        public: schema === "public",
        hash: schema != null && schema !== "public" ? hash(`identifier:${schema}`) : null,
      };
    } catch {
      /* URL details are never printed. */
    }
    return {
      reason: "STRUCTURAL_SUMMARY",
      cliSchemaParameter,
      runtimeSchemaOption: "NOT_CONFIGURED",
      schemaAlignment: "UNVERIFIED",
      statementCount: statements.length,
      truncated: statements.length > 64,
      statements: statements.slice(0, 64),
    };
  } catch {
    return { reason: "LEXICAL_REJECTED", statementCount: null, statements: [] };
  }
}
