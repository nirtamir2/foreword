import process from "node:process";
import { Client } from "pg";
import { z } from "zod";

const rowCountsSchema = z.object({
  vocabulary_candidate: z.string().regex(/^\d+$/),
  vocab_card_video: z.string().regex(/^\d+$/),
  study_review: z.string().regex(/^\d+$/),
});

async function productionRowCounts() {
  if (process.env.VERCEL_ENV !== "production" || !process.env.DATABASE_URL) {
    throw new Error("Production database configuration is required.");
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
  });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    const result = await client.query(`
      SELECT
        (SELECT count(*)::text FROM "vocabulary_candidate") AS vocabulary_candidate,
        (SELECT count(*)::text FROM "vocab_card_video") AS vocab_card_video,
        (SELECT count(*)::text FROM "study_review") AS study_review
    `);
    await client.query("COMMIT");
    const counts = rowCountsSchema.parse(result.rows[0]);
    console.log(JSON.stringify(counts));
  } finally {
    await client.end();
  }
}

try {
  await productionRowCounts();
} catch {
  console.error("Production row-count check failed. Connection details suppressed.");
  process.exitCode = 1;
}
