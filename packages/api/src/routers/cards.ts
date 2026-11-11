import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { assertBookOwnership, protectedProcedure } from "../index";
import { toExamples } from "../vocabulary/examples";

export const reviewStatusSchema = z.enum(["NEW", "LEARNING", "KNOWN"]);
export const cardSortSchema = z.enum(["priority", "alphabetical", "recent"]);
const cardExampleSchema = z.object({
  source: z.string().max(400),
  translation: z.string().max(400),
});

const ORDER_BY = {
  priority: [{ priorityScore: "desc" }, { createdAt: "asc" }],
  alphabetical: [{ displayForm: "asc" }],
  recent: [{ createdAt: "desc" }],
} as const;

const cardIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(200)
  .transform((ids) => [...new Set(ids)]);

export const cardsRouter = {
  list: protectedProcedure
    .input(
      z.object({
        bookId: z.string().min(1),
        sort: cardSortSchema.default("priority"),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await assertBookOwnership({ db: context.db, bookId: input.bookId, userId });
      const cards = await context.db.vocabCard.findMany({
        where: { bookId: input.bookId, userId },
        include: {
          reviewState: true,
          video: { select: { status: true, videoUrl: true } },
        },
        orderBy: [...ORDER_BY[input.sort]],
      });
      return cards.map((card) => ({
        id: card.id,
        headword: card.headword,
        displayForm: card.displayForm,
        lemma: card.lemma,
        isPhrase: card.isPhrase,
        phraseType: card.phraseType,
        partOfSpeech: card.partOfSpeech,
        translation: card.translation,
        explanation: card.explanation,
        examples: toExamples(card.examples),
        difficulty: card.difficulty,
        usefulness: card.usefulness,
        bookFrequency: card.bookFrequency,
        firstChapterIndex: card.firstChapterIndex,
        priorityScore: card.priorityScore,
        edited: card.edited,
        createdAt: card.createdAt,
        status: card.reviewState?.status ?? ("NEW" as const),
        timesSeen: card.reviewState?.timesSeen ?? 0,
        timesCorrect: card.reviewState?.timesCorrect ?? 0,
        lastReviewedAt: card.reviewState?.lastReviewedAt ?? null,
        videoStatus: card.video?.status ?? null,
        videoUrl: card.video?.videoUrl ?? null,
      }));
    }),

  update: protectedProcedure
    .input(
      z.object({
        cardId: z.string().min(1),
        displayForm: z.string().min(1).max(160).optional(),
        translation: z.string().min(1).max(400).optional(),
        explanation: z.string().max(1000).optional(),
        partOfSpeech: z.string().max(60).nullable().optional(),
        examples: z.array(cardExampleSchema).max(3).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { cardId, ...changes } = input;
      const result = await context.db.vocabCard.updateMany({
        where: { id: cardId, userId: context.session.user.id },
        data: { ...changes, edited: true },
      });
      if (result.count === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Card not found" });
      }
      return { success: true };
    }),

  /** Set the learning status for one or many cards. */
  setStatus: protectedProcedure
    .input(z.object({ cardIds: cardIdsSchema, status: reviewStatusSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const owned = await context.db.vocabCard.findMany({
        where: { id: { in: input.cardIds }, userId },
        select: { id: true },
      });
      if (owned.length !== input.cardIds.length) {
        throw new ORPCError("NOT_FOUND", { message: "One or more cards were not found" });
      }
      const now = new Date();
      await context.db.$transaction(async (tx) => {
        for (const card of owned) {
          await tx.reviewState.upsert({
            where: { cardId: card.id },
            create: {
              cardId: card.id,
              userId,
              status: input.status,
              knownAt: input.status === "KNOWN" ? now : null,
            },
            update: {
              status: input.status,
              knownAt: input.status === "KNOWN" ? now : null,
            },
          });
        }
      });
      return { updated: owned.length };
    }),

  delete: protectedProcedure
    .input(z.object({ cardIds: cardIdsSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const cards = await context.db.vocabCard.findMany({
        where: { id: { in: input.cardIds }, userId },
        select: { id: true, bookId: true, headword: true },
      });
      if (cards.length === 0) {
        return { deleted: 0 };
      }
      await context.db.$transaction(async (tx) => {
        for (const card of cards) {
          await tx.vocabularyCandidate.updateMany({
            where: { bookId: card.bookId, userId, normalized: card.headword },
            data: { status: "DELETED" },
          });
        }
        await tx.vocabCard.deleteMany({
          where: { id: { in: cards.map((card) => card.id) }, userId },
        });
      });
      return { deleted: cards.length };
    }),
};
