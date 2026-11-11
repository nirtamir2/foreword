import { readFileSync } from "node:fs";

/** @param {string} value */
function statements(value) {
  return value
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.replaceAll(/\s+/g, " ").trim())
    .filter((statement) => statement.length > 0);
}

/** @param {string} sql */
export function assertProductionSchemaDiff(sql) {
  const allowed = new Set(
    statements(readFileSync(new URL("productionSchemaChanges.sql", import.meta.url), "utf8")),
  );
  const changes = statements(sql);
  if (changes.some((statement) => !allowed.has(statement))) {
    throw new Error("Production schema diff contains unapproved SQL. App build stopped.");
  }
  return changes.length;
}
