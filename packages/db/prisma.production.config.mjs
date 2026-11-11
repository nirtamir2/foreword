import process from "node:process";
import { fileURLToPath } from "node:url";

// Build-only configuration. Never load a local .env as a production fallback.
export default {
  schema: fileURLToPath(new URL("prisma/schema", import.meta.url)),
  datasource: { url: process.env.DATABASE_URL },
};
