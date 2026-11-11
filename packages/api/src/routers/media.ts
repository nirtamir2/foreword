import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { Context } from "../context";
import { protectedProcedure } from "../index";
import { canStartVideoJob, nextVideoPollState, videoPhase } from "../media/videoJobState";
import { toExamples } from "../vocabulary/examples";

type Db = Context["db"];

interface ClaimedVideo {
  id: string;
  updatedAt: Date;
}

/**
 * Take ownership of a card's video record before paying for a submission. The insert relies
 * on the unique cardId and the update on an unchanged updatedAt, so of two concurrent requests
 * only one claims the record; the other returns the winner's state.
 */
async function claimVideoRecord({
  db,
  cardId,
  userId,
  model,
  existing,
}: {
  db: Db;
  cardId: string;
  userId: string;
  model: string;
  existing: { id: string; updatedAt: Date; prompt: string } | null;
}): Promise<ClaimedVideo | null> {
  if (existing == null) {
    const inserted = await db.vocabCardVideo.createMany({
      data: [{ cardId, userId, status: "QUEUED", jobId: null, model, prompt: "" }],
      skipDuplicates: true,
    });
    if (inserted.count === 0) {
      return null;
    }
    return await db.vocabCardVideo.findUnique({
      where: { cardId },
      select: { id: true, updatedAt: true },
    });
  }
  const claimedAt = new Date();
  const updated = await db.vocabCardVideo.updateMany({
    where: { id: existing.id, updatedAt: existing.updatedAt },
    data: {
      status: "QUEUED",
      jobId: null,
      model,
      videoUrl: null,
      error: null,
      pollErrorCount: 0,
      updatedAt: claimedAt,
    },
  });
  return updated.count === 0 ? null : { id: existing.id, updatedAt: claimedAt };
}

function toResponse(record: {
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  videoUrl: string | null;
  prompt: string;
  error: string | null;
}) {
  return {
    status: record.status,
    videoUrl: record.videoUrl,
    prompt: record.prompt.length > 0 ? record.prompt : null,
    error: record.error,
  };
}

export const mediaRouter = {
  /** Queue a short teaching clip for a card. Idempotent while a job is already running. */
  requestCardVideo: protectedProcedure
    .input(z.object({ cardId: z.string().min(1), regenerate: z.boolean().default(false) }))
    .handler(async ({ input, context }) => {
      if (!context.video.isConfigured) {
        throw new ORPCError("SERVICE_UNAVAILABLE", {
          message: "Video generation is not configured.",
        });
      }
      const userId = context.session.user.id;
      const card = await context.db.vocabCard.findFirst({
        where: { id: input.cardId, userId },
        include: { video: true, book: { select: { bookLanguage: true } } },
      });
      if (card == null) {
        throw new ORPCError("NOT_FOUND", { message: "Card not found" });
      }
      const existing = card.video;
      const phase = videoPhase({ record: existing, now: new Date() });
      if (existing != null && !canStartVideoJob({ phase, regenerate: input.regenerate })) {
        return toResponse(existing);
      }

      const claimed = await claimVideoRecord({
        db: context.db,
        cardId: card.id,
        userId,
        model: context.video.model,
        existing,
      });
      if (claimed == null) {
        // Another request claimed the record first; report its state instead of paying twice.
        const current = await context.db.vocabCardVideo.findUniqueOrThrow({
          where: { cardId: card.id },
        });
        return toResponse(current);
      }
      // Writes after the provider call only land if nobody re-claimed the record meanwhile.
      const stillOwned = { id: claimed.id, updatedAt: claimed.updatedAt, jobId: null };

      const prompt = await context.video.buildPrompt({
        displayForm: card.displayForm,
        translation: card.translation,
        explanation: card.explanation,
        partOfSpeech: card.partOfSpeech,
        bookLanguage: card.book.bookLanguage,
        example: toExamples(card.examples)[0]?.source ?? null,
      });

      const submission = await context.video.submit({ prompt }).catch((error: unknown) => ({
        failure: error instanceof Error ? error.message : "Video generation failed",
      }));
      if ("failure" in submission) {
        await context.db.vocabCardVideo.updateMany({
          where: stillOwned,
          data: { status: "FAILED", prompt, error: submission.failure },
        });
        throw new ORPCError("BAD_GATEWAY", { message: submission.failure });
      }

      const recorded = await context.db.vocabCardVideo.updateMany({
        where: stillOwned,
        data: { status: "QUEUED", jobId: submission.jobId, prompt },
      });
      if (recorded.count === 0) {
        console.warn("Video claim was taken over before the job id was stored", {
          cardId: card.id,
        });
      }
      const current = await context.db.vocabCardVideo.findUniqueOrThrow({
        where: { cardId: card.id },
      });
      return toResponse(current);
    }),

  /** Poll the clip status. Syncs the provider state into the database. */
  cardVideo: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const record = await context.db.vocabCardVideo.findFirst({
        where: { cardId: input.cardId, userId },
      });
      if (record == null) {
        return { status: null, videoUrl: null, prompt: null, error: null, progress: null };
      }
      const phase = videoPhase({ record, now: new Date() });

      if (phase === "abandoned") {
        await context.db.vocabCardVideo.updateMany({
          where: { id: record.id, updatedAt: record.updatedAt, jobId: null },
          data: { status: "FAILED", error: "The video request was interrupted. Try again." },
        });
        const current = await context.db.vocabCardVideo.findUniqueOrThrow({
          where: { id: record.id },
        });
        return { ...toResponse(current), progress: null };
      }
      if (phase !== "running" || record.jobId == null || !context.video.isConfigured) {
        return { ...toResponse(record), progress: null };
      }

      const { jobId } = record;
      const result = await context.video
        .status({ jobId })
        .then((snapshot) => ({ ok: true as const, snapshot }))
        .catch((error: unknown) => ({
          ok: false as const,
          message: error instanceof Error ? error.message : "Could not read video status",
        }));
      const next = nextVideoPollState({ current: record, result });
      // Keyed on the job id this poll read, so a poll that resolves after a regenerate
      // cannot write the old job's state over the new one.
      const written = await context.db.vocabCardVideo.updateMany({
        where: { id: record.id, jobId },
        data: next,
      });
      if (written.count === 0) {
        const current = await context.db.vocabCardVideo.findUniqueOrThrow({
          where: { id: record.id },
        });
        return { ...toResponse(current), progress: null };
      }
      return {
        ...toResponse({ ...record, ...next }),
        progress: result.ok ? result.snapshot.progress : null,
      };
    }),
};
