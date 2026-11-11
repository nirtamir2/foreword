import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// oxlint-disable-next-line eslint-unicorn/no-top-level-side-effects -- the Prisma CLI config must load the app env before reading DATABASE_URL
dotenv.config({
  path: "../../apps/web/.env",
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
