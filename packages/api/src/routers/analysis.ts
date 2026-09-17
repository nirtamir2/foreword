import { ORPCError } from "@orpc/server";
import { z } from "zod";
import type { CandidateKind } from "@app-template/db";
import type { Context } from "../context";
import { protectedProcedure } from "../index";
import { toStringArray } from "../vocabulary/examples";
import { isProviderWideAiError, normalizeAiError } from "../vocabulary/normalizeAiError";
import {
  demotedPriority,
  normalizeKey,
  planCandidateRefinement,
} from "../vocabulary/planCandidateRefinement";
import type { StoredCandidate } from "../vocabulary/planCandidateRefinement";
import { refineInBatches } from "../vocabulary/refineInBatches";

const candidateSchema = z.object({
  surface: z.string().min(1).max(120),
  normalized: z.string().min(1).max(120),
  kind: z.enum(["word", "phrase"]),
  snippets: z.array(z.string().max(240)).max(3),
  localDifficulty: z.number().min(0).max(1),
  bookFrequency: z.number().int().nonnegative(),
  firstChapterIndex: z.number().int().nonnegative(),
  earliness: z.number().min(0).max(1),
  usefulness: z.number().min(0).max(1),
  storyImportance: z.number().min(0).max(1),
  frequencyWeight: z.number().min(0).max(1),
  priorityScore: z.number(),
});

/** Bounded batch sizes keep every request small and resumable. */
export const SAVE_CANDIDATES_BATCH_LIMIT = 250;
export const REFINE_BATCH_LIMIT = 40;
const AI_ITEMS_PER_CALL = 12;

type CandidateInput = z.infer<typeof candidateSchema>;

function toDbKind(kind: CandidateInput["kind"]): CandidateKind {
  return kind === "phrase" ? "PHRASE" : "WORD";
}

async function loadOwnedBook({
  db,
  userId,
  bookId,
}: {
  db: Context["db"];
  userId: string;
  bookId: string;
}) {
  const book = await db.book.findFirst({
    where: { id: bookId, userId },
    select: {
      id: true,
      bookLanguage: true,
      nativeLanguage: true,
      level: true,
      analysisStatus: true,
    },
  });
  if (book == null) {
    throw new ORPCError("NOT_FOUND", { message: "Book not found" });
  }
  return book;
}

async function knownFormsForLanguage({
  db,
  userId,
  bookLanguage,
}: {
  db: Context["db"];
  userId: string;
  bookLanguage: string;
}): Promise<Set<string>> {
  const rows = await db.vocabCard.findMany({
    where: { userId, reviewState: { status: "KNOWN" }, book: { bookLanguage } },
    select: { headword: true, lemma: true },
  });
  const forms = new Set<string>();
  for (const row of rows) {
    forms.add(normalizeKey(row.headword));
    if (row.lemma != null) {
      forms.add(normalizeKey(row.lemma));
    }
  }
  return forms;
}

export const analysisRouter = {
  /**
   * Normalized forms the browser should skip when ranking: words the user already knows
   * in this language plus everything already stored for this book.
   */
  excludedForms: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const book = await loadOwnedBook({ db: context.db, userId, bookId: input.bookId });
      const [known, cards, candidates] = await Promise.all([
        knownFormsForLanguage({ db: context.db, userId, bookLanguage: book.bookLanguage }),
        context.db.vocabCard.findMany({
          where: { bookId: book.id, userId },
          select: { headword: true, lemma: true },
        }),
        context.db.vocabularyCandidate.findMany({
          where: { bookId: book.id, userId },
          select: { normalized: true },
        }),
      ]);
      for (const card of cards) {
        known.add(normalizeKey(card.headword));
        if (card.lemma != null) {
          known.add(normalizeKey(card.lemma));
        }
      }
      for (const candidate of candidates) {
        known.add(candidate.normalized);
      }
      return [...known];
    }),

  /** Persist one bounded batch of locally ranked candidates. Marks the book as analyzing. */
  saveCandidates: protectedProcedure
    .input(
      z.object({
        bookId: z.string().min(1),
        items: z.array(candidateSchema).max(SAVE_CANDIDATES_BATCH_LIMIT),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const book = await loadOwnedBook({ db: context.db, userId, bookId: input.bookId });

      const [known, existingCards] = await Promise.all([
        knownFormsForLanguage({ db: context.db, userId, bookLanguage: book.bookLanguage }),
        context.db.vocabCard.findMany({
          where: { bookId: book.id, userId },
          select: { headword: true },
        }),
      ]);
      const blocked = new Set([
        ...known,
        ...existingCards.map((card) => normalizeKey(card.headword)),
      ]);

      const deduped = new Map<string, CandidateInput>();
      for (const item of input.items) {
        const key = normalizeKey(item.normalized);
        if (key.length === 0 || blocked.has(key)) {
          continue;
        }
        const current = deduped.get(key);
        if (current == null || item.priorityScore > current.priorityScore) {
          deduped.set(key, { ...item, normalized: key });
        }
      }

      let saved = 0;
      if (deduped.size > 0) {
        const created = await context.db.vocabularyCandidate.createMany({
          data: Array.from(deduped.values(), (candidate) => ({
            bookId: book.id,
            userId,
            surface: candidate.surface,
            normalized: candidate.normalized,
            kind: toDbKind(candidate.kind),
            snippets: candidate.snippets,
            localDifficulty: candidate.localDifficulty,
            bookFrequency: candidate.bookFrequency,
            firstChapterIndex: candidate.firstChapterIndex,
            earliness: candidate.earliness,
            usefulness: candidate.usefulness,
            storyImportance: candidate.storyImportance,
            frequencyWeight: candidate.frequencyWeight,
            priorityScore: candidate.priorityScore,
          })),
          skipDuplicates: true,
        });
        saved = created.count;
      }

      if (book.analysisStatus === "PENDING") {
        await context.db.book.update({
          where: { id: book.id },
          data: { analysisStatus: "ANALYZING" },
        });
      }

      const pendingCount = await context.db.vocabularyCandidate.count({
        where: { bookId: book.id, userId, status: "PENDING" },
      });
      return { received: input.items.length, saved, pendingCount };
    }),

  /** Turn the highest-priority pending candidates into study cards. Safe to call repeatedly. */
  refineNext: protectedProcedure
    .input(
      z.object({
        bookId: z.string().min(1),
        limit: z.number().int().min(1).max(REFINE_BATCH_LIMIT).default(REFINE_BATCH_LIMIT),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const book = await loadOwnedBook({ db: context.db, userId, bookId: input.bookId });

      const rows = await context.db.vocabularyCandidate.findMany({
        where: { bookId: book.id, userId, status: "PENDING" },
        orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
        take: input.limit,
      });
      const candidates: Array<StoredCandidate> = rows.map((row) => ({
        id: row.id,
        surface: row.surface,
        normalized: row.normalized,
        kind: row.kind === "PHRASE" ? "phrase" : "word",
        snippets: toStringArray(row.snippets),
        localDifficulty: row.localDifficulty,
        bookFrequency: row.bookFrequency,
        firstChapterIndex: row.firstChapterIndex,
        earliness: row.earliness,
        usefulness: row.usefulness,
        storyImportance: row.storyImportance,
        frequencyWeight: row.frequencyWeight,
        priorityScore: row.priorityScore,
      }));

      if (candidates.length === 0) {
        return { processed: 0, created: 0, skipped: 0, unresolved: 0, pendingCount: 0 };
      }

      const existing = await context.db.vocabCard.findMany({
        where: {
          bookId: book.id,
          userId,
          headword: { in: candidates.map((candidate) => candidate.normalized) },
        },
        select: { headword: true },
      });
      const existingHeadwords = new Set(existing.map((card) => normalizeKey(card.headword)));
      const toRefine = candidates.filter(
        (candidate) => !existingHeadwords.has(candidate.normalized),
      );

      const refinement =
        toRefine.length === 0
          ? { refined: [], unresolvedIds: [], firstError: null }
          : await refineInBatches({
              refine: context.ai.refineVocabulary,
              batchSize: AI_ITEMS_PER_CALL,
              input: {
                bookLanguage: book.bookLanguage,
                nativeLanguage: book.nativeLanguage,
                level: book.level,
                items: toRefine.map((candidate) => ({
                  id: candidate.id,
                  surface: candidate.surface,
                  kind: candidate.kind,
                  snippets: candidate.snippets,
                  localDifficulty: candidate.localDifficulty,
                  localFrequency: candidate.bookFrequency,
                })),
              },
            });

      if (refinement.firstError != null) {
        const aiError = normalizeAiError(refinement.firstError);
        const totalFailure =
          refinement.refined.length === 0 && isProviderWideAiError(refinement.firstError);
        const details = {
          bookId: book.id,
          refined: refinement.refined.length,
          unresolved: refinement.unresolvedIds.length,
          providerStatus: aiError.providerStatus,
          providerMessage: aiError.providerMessage,
        };
        if (totalFailure) {
          console.error("Vocabulary refinement failed", details);
          throw new ORPCError(aiError.code, { message: aiError.message });
        }
        console.warn("Vocabulary refinement partially failed", details);
      }

      const plan = planCandidateRefinement({
        candidates,
        refined: refinement.refined,
        existingHeadwords,
      });

      const pendingCount = await context.db.$transaction(async (tx) => {
        const resolvedIds = [...plan.refinedIds, ...plan.duplicateIds];
        if (resolvedIds.length > 0) {
          await tx.vocabularyCandidate.updateMany({
            where: { id: { in: resolvedIds }, bookId: book.id, userId },
            data: { status: "REFINED" },
          });
        }
        if (plan.skippedIds.length > 0) {
          await tx.vocabularyCandidate.updateMany({
            where: { id: { in: plan.skippedIds }, bookId: book.id, userId },
            data: { status: "SKIPPED" },
          });
        }
        if (plan.unresolvedIds.length > 0) {
          await tx.vocabularyCandidate.updateMany({
            where: { id: { in: plan.unresolvedIds }, bookId: book.id, userId },
            data: { priorityScore: demotedPriority({ candidates }) },
          });
        }
        if (plan.cards.length > 0) {
          const createdCards = await tx.vocabCard.createManyAndReturn({
            data: plan.cards.map((card) => ({
              bookId: book.id,
              userId,
              headword: card.headword,
              displayForm: card.displayForm,
              lemma: card.lemma,
              isPhrase: card.isPhrase,
              phraseType: card.phraseType,
              partOfSpeech: card.partOfSpeech,
              translation: card.translation,
              explanation: card.explanation,
              examples: card.examples,
              difficulty: card.difficulty,
              usefulness: card.usefulness,
              bookFrequency: card.bookFrequency,
              firstChapterIndex: card.firstChapterIndex,
              priorityScore: card.priorityScore,
              aiModel: context.ai.isConfigured ? context.ai.model : null,
            })),
            skipDuplicates: true,
            select: { id: true },
          });
          if (createdCards.length > 0) {
            await tx.reviewState.createMany({
              data: createdCards.map((card) => ({ cardId: card.id, userId })),
              skipDuplicates: true,
            });
          }
        }
        return await tx.vocabularyCandidate.count({
          where: { bookId: book.id, userId, status: "PENDING" },
        });
      });

      return {
        processed: candidates.length,
        created: plan.cards.length,
        skipped: plan.skippedIds.length,
        unresolved: plan.unresolvedIds.length,
        pendingCount,
      };
    }),

  /** Mark preparation complete. Only READY books are presented as fully prepared. */
  finalize: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const result = await context.db.book.updateMany({
        where: { id: input.bookId, userId: context.session.user.id },
        data: { analysisStatus: "READY" },
      });
      if (result.count === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Book not found" });
      }
      return { success: true };
    }),

  /** Whether the AI layer is configured; the UI adapts its copy when it is not. */
  capabilities: protectedProcedure.handler(({ context }) => ({
    aiConfigured: context.ai.isConfigured,
    videoConfigured: context.video.isConfigured,
  })),
};
