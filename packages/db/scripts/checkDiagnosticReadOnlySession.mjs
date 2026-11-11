import process from "node:process";
import { diagnosticErrorClass } from "./diagnosticErrorClass.mjs";
import { diagnosticErrorCode } from "./diagnosticErrorCode.mjs";

let stage = "IMPORT_PG";
/** @type {import("pg").Client | null} */
let client = null;
let failure = null;
try {
  const { Client } = await import("pg");
  stage = "LOAD_CONFIG";
  const { default: config } = await import("../prisma.diagnostic.config.mjs");
  stage = "CREATE_CLIENT";
  client = new Client({
    connectionString: config.datasource.url,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 10_000,
  });
  stage = "CONNECT";
  await client.connect();
  stage = "SHOW_DEFAULT_READ_ONLY";
  const defaults = await client.query("SHOW default_transaction_read_only");
  stage = "SHOW_TRANSACTION_READ_ONLY";
  const current = await client.query("SHOW transaction_read_only");
  stage = "VERIFY_SESSION";
  if (
    defaults.rows[0]?.default_transaction_read_only !== "on" ||
    current.rows[0]?.transaction_read_only !== "on"
  ) {
    failure = { stage, code: "READ_ONLY_DISABLED", name: "Error" };
  }
} catch (error) {
  failure = { stage, code: diagnosticErrorCode(error), name: diagnosticErrorClass(error) };
} finally {
  try {
    await client?.end();
  } catch (error) {
    failure ??= {
      stage: "CLOSE",
      code: diagnosticErrorCode(error),
      name: diagnosticErrorClass(error),
    };
  }
}
if (failure == null) console.log("FOREWORD_SESSION_READ_ONLY");
else {
  console.log(JSON.stringify(failure));
  process.exitCode = 1;
}
