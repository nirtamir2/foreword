/** @param {string} value */
export function readOnlyDatabaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("PostgreSQL is required for the read-only diagnostic.");
  }
  const existing = url.searchParams.get("options") ?? "";
  url.searchParams.set(
    "options",
    `${existing} -c default_transaction_read_only=on -c transaction_read_only=on`.trim(),
  );
  return url.href;
}
