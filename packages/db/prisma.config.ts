import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../../apps/web/.env",
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Optional so `prisma generate` (a build step that never connects) works without
    // database credentials. Commands that connect (migrate, db push, studio) still fail when it
    // is missing, and the app validates DATABASE_URL at runtime in @app-template/env.
    url: process.env.DATABASE_URL,
  },
});
