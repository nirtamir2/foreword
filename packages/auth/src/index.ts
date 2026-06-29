import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import prisma from "@app-template/db";
import { env } from "@app-template/env/server";

const developmentPortlessURL = env.NODE_ENV === "development" ? (env.PORTLESS_URL ?? null) : null;

const authURL = developmentPortlessURL ?? env.BETTER_AUTH_URL;

const trustedOrigins = [
  ...new Set([
    env.BETTER_AUTH_URL,
    env.CORS_ORIGIN,
    authURL,
    ...(env.NODE_ENV === "development" ? ["https://*.localhost"] : []),
  ]),
];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: authURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
});
