import process from "node:process";
import { fileURLToPath } from "node:url";
import { readOnlyDatabaseUrl } from "./scripts/readOnlyDatabaseUrl.mjs";

// Diagnostic only. Keep the normal production config unchanged and never load dotenv.
export default {
  schema: fileURLToPath(new URL("prisma/schema", import.meta.url)),
  datasource: { url: readOnlyDatabaseUrl(process.env.DATABASE_URL ?? "") },
};
