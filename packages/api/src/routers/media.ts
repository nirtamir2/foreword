import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { VideoStatus } from "@app-template/db";
import { protectedProcedure } from "../index";
import type { VideoJobStatus } from "../media/videoService";
import { toExamples } from "../vocabulary/examples";

function toDbStatus(status: VideoJobStatus): VideoStatus {
  switch (status) {
    case "pending": {
      return "QUEUED";
    }
    case "processing": {
      return "IN_PROGRESS";
    }
    case "completed": {
      return "COMPLETED";
    }
    case "failed": {
      return "FAILED";
    }
  }
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
      if (
        existing != null &&
        !input.regenerate &&
        ["COMPLETED", "QUEUED", "IN_PROGRESS"].includes(existing.status)
      ) {
        return { status: existing.status, videoUrl: existing.videoUrl, prompt: existing.prompt };
      }

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
        await context.db.vocabCardVideo.upsert({
          where: { cardId: card.id },
          create: {
            cardId: card.id,
            userId,
            status: "FAILED",
            model: context.video.model,
            prompt,
            error: submission.failure,
          },
          update: {
            status: "FAILED",
            model: context.video.model,
            prompt,
            error: submission.failure,
            videoUrl: null,
            jobId: null,
          },
        });
        throw new ORPCError("BAD_GATEWAY", { message: submission.failure });
      }
      const { jobId } = submission;

      const record = await context.db.vocabCardVideo.upsert({
        where: { cardId: card.id },
        create: {
          cardId: card.id,
          userId,
          status: "QUEUED",
          jobId,
          model: context.video.model,
          prompt,
        },
        update: {
          status: "QUEUED",
          jobId,
          model: context.video.model,
          prompt,
          error: null,
          videoUrl: null,
        },
      });
      return { status: record.status, videoUrl: record.videoUrl, prompt: record.prompt };
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
      const isActive = record.status === "QUEUED" || record.status === "IN_PROGRESS";
      if (!isActive || record.jobId == null || !context.video.isConfigured) {
        return {
          status: record.status,
          videoUrl: record.videoUrl,
          prompt: record.prompt,
          error: record.error,
          progress: null,
        };
      }
      try {
        const snapshot = await context.video.status({ jobId: record.jobId });
        const status = toDbStatus(snapshot.status);
        const updated = await context.db.vocabCardVideo.update({
          where: { id: record.id },
          data: {
            status,
            videoUrl: snapshot.url ?? record.videoUrl,
            error: snapshot.error,
          },
        });
        return {
          status: updated.status,
          videoUrl: updated.videoUrl,
          prompt: updated.prompt,
          error: updated.error,
          progress: snapshot.progress,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not read video status";
        const failed = await context.db.vocabCardVideo.update({
          where: { id: record.id },
          data: { status: "FAILED", error: message },
        });
        return {
          status: failed.status,
          videoUrl: failed.videoUrl,
          prompt: failed.prompt,
          error: failed.error,
          progress: null,
        };
      }
    }),
};
