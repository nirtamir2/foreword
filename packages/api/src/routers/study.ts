import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { assertBookOwnership, protectedProcedure } from "../index";
import { toExamples } from "../vocabulary/examples";

export const studyModeSchema = z.enum(["FLASHCARD", "MCQ", "RECALL"]);
export const reviewResultSchema = z.enum(["KNOWN", "STILL_LEARNING", "CORRECT", "INCORRECT"]);

type ReviewStatus = "NEW" | "LEARNING" | "KNOWN";

/** Two correct answers graduate a card; a self-reported "I know this" graduates immediately. */
function nextStatus({
  result,
  timesCorrect,
}: {
  result: z.infer<typeof reviewResultSchema>;
  timesCorrect: number;
}): ReviewStatus {
  if (result === "KNOWN") {
    return "KNOWN";
  }
  if (result === "CORRECT" && timesCorrect >= 2) {
    return "KNOWN";
  }
  return "LEARNING";
}

function scopeFilter({ scope }: { scope: "TO_LEARN" | "KNOWN" | "ALL" }) {
  if (scope === "ALL") {
    return {};
  }
  if (scope === "KNOWN") {
    return { reviewState: { status: "KNOWN" as const } };
  }
  return { OR: [{ reviewState: null }, { reviewState: { status: { not: "KNOWN" as const } } }] };
}

export const studyRouter = {
  /** Session deck: cards not yet known, highest priority first, plus distractors for quizzes. */
  session: protectedProcedure
    .input(
      z.object({
        bookId: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(15),
        scope: z.enum(["TO_LEARN", "KNOWN", "ALL"]).default("TO_LEARN"),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const book = await context.db.book.findFirst({
        where: { id: input.bookId, userId },
        select: { id: true, title: true, bookLanguage: true, nativeLanguage: true },
      });
      if (book == null) {
        throw new ORPCError("NOT_FOUND", { message: "Book not found" });
      }
      const statusFilter = scopeFilter({ scope: input.scope });

      const [cards, distractorPool] = await Promise.all([
        context.db.vocabCard.findMany({
          where: { bookId: book.id, userId, ...statusFilter },
          include: { reviewState: true, video: { select: { status: true, videoUrl: true } } },
          orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
          take: input.limit,
        }),
        context.db.vocabCard.findMany({
          where: { bookId: book.id, userId },
          select: { translation: true },
          orderBy: { createdAt: "desc" },
          take: 120,
        }),
      ]);

      return {
        book: {
          id: book.id,
          title: book.title,
          bookLanguage: book.bookLanguage,
          nativeLanguage: book.nativeLanguage,
        },
        distractors: [...new Set(distractorPool.map((card) => card.translation))],
        cards: cards.map((card) => ({
          id: card.id,
          displayForm: card.displayForm,
          lemma: card.lemma,
          partOfSpeech: card.partOfSpeech,
          phraseType: card.phraseType,
          translation: card.translation,
          explanation: card.explanation,
          examples: toExamples(card.examples),
          difficulty: card.difficulty,
          status: card.reviewState?.status ?? ("NEW" as const),
          timesSeen: card.reviewState?.timesSeen ?? 0,
          videoStatus: card.video?.status ?? null,
          videoUrl: card.video?.videoUrl ?? null,
        })),
      };
    }),

  /** Record one answer: append to the log and move the card's learning state. */
  recordAnswer: protectedProcedure
    .input(
      z.object({ cardId: z.string().min(1), mode: studyModeSchema, result: reviewResultSchema }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const card = await context.db.vocabCard.findFirst({
        where: { id: input.cardId, userId },
        select: {
          id: true,
          reviewState: { select: { timesSeen: true, timesCorrect: true, timesIncorrect: true } },
        },
      });
      if (card == null) {
        throw new ORPCError("NOT_FOUND", { message: "Card not found" });
      }
      const previous = card.reviewState;
      const timesCorrect = (previous?.timesCorrect ?? 0) + (input.result === "CORRECT" ? 1 : 0);
      const timesIncorrect =
        (previous?.timesIncorrect ?? 0) + (input.result === "INCORRECT" ? 1 : 0);
      const status = nextStatus({ result: input.result, timesCorrect });
      const now = new Date();

      await context.db.$transaction([
        context.db.reviewState.upsert({
          where: { cardId: card.id },
          create: {
            cardId: card.id,
            userId,
            status,
            timesSeen: 1,
            timesCorrect,
            timesIncorrect,
            lastReviewedAt: now,
            knownAt: status === "KNOWN" ? now : null,
          },
          update: {
            status,
            timesSeen: (previous?.timesSeen ?? 0) + 1,
            timesCorrect,
            timesIncorrect,
            lastReviewedAt: now,
            knownAt: status === "KNOWN" ? now : null,
          },
        }),
        context.db.studyReview.create({
          data: { cardId: card.id, userId, mode: input.mode, result: input.result },
        }),
      ]);

      return { status };
    }),

  /** Recent study activity for the book page. */
  summary: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await assertBookOwnership({ db: context.db, bookId: input.bookId, userId });
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [reviewsThisWeek, lastReview] = await Promise.all([
        context.db.studyReview.count({
          where: { userId, card: { bookId: input.bookId }, createdAt: { gte: since } },
        }),
        context.db.studyReview.findFirst({
          where: { userId, card: { bookId: input.bookId } },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);
      return { reviewsThisWeek, lastReviewedAt: lastReview?.createdAt ?? null };
    }),
};
