import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@app-template/env/server";
import { PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;

export type * from "../prisma/generated/enums";
export type * from "../prisma/generated/models";
export type * from "../prisma/generated/commonInputTypes";
