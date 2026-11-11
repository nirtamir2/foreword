import process from "node:process";
import { Client } from "pg";
import * as diagnosticConfig from "../prisma.diagnostic.config.mjs";
import { diagnosticErrorCode } from "./diagnosticErrorCode.mjs";

const client = new Client({
  connectionString: diagnosticConfig.default.datasource.url,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 10_000,
});
try {
  await client.connect();
  const defaults = await client.query("SHOW default_transaction_read_only");
  const current = await client.query("SHOW transaction_read_only");
  if (
    defaults.rows[0]?.default_transaction_read_only !== "on" ||
    current.rows[0]?.transaction_read_only !== "on"
  ) {
    console.log("FOREWORD_SESSION_NOT_READ_ONLY");
    process.exitCode = 1;
  } else console.log("FOREWORD_SESSION_READ_ONLY");
} catch (error) {
  console.log(JSON.stringify({ code: diagnosticErrorCode(error) }));
  process.exitCode = 1;
} finally {
  await client.end();
}
