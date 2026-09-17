import * as Comlink from "comlink";
import type { LearnerLevel } from "@app-template/text-analysis";
import type { ParsedBook } from "@/lib/parsing/types";
import { client } from "@/utils/orpc";
import type { AnalyzeWorkerApi } from "./analyze.worker";
import { progressFor } from "./preparationProgress";
import type { PreparationProgress } from "./preparationProgress";
import { resolveStartChapter } from "./resolveStartChapter";
import type { PositionType } from "./resolveStartChapter";

/** How many candidates the browser ranks and saves per analysis run. */
const CANDIDATE_POOL_SIZE = 600;
/** Server-side bound for one saveCandidates request. */
const SAVE_BATCH_SIZE = 200;
/** Cards to refine per server call. Small enough to finish well within a request. */
const REFINE_BATCH_SIZE = 24;
/** Initial preparation stops once this many cards exist or the backlog is exhausted. */
const INITIAL_CARD_TARGET = 48;
const MAX_REFINE_ROUNDS_PER_RUN = 4;

export interface PreparationContext {
  bookId: string;
  language: string;
  level: LearnerLevel;
  positionType: PositionType;
  positionValue: number | null;
  onProgress: (progress: PreparationProgress) => void;
  signal?: AbortSignal;
}

export interface RefinementOutcome {
  created: number;
  unresolved: number;
  pendingCount: number;
  rounds: number;
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted === true) {
    throw new DOMException("Preparation cancelled", "AbortError");
  }
}

/**
 * Rank the parsed book in a Web Worker and persist candidates in bounded batches.
 * The full text stays in the browser; only ranked forms plus short snippets are sent.
 */
export async function rankAndSaveCandidates({
  book,
  context,
}: {
  book: ParsedBook;
  context: PreparationContext;
}): Promise<{ saved: number; pendingCount: number; frequencyListBundled: boolean }> {
  const { onProgress, signal } = context;
  onProgress(progressFor({ stage: "ranking", ratio: 0.05 }));

  const excluded = await client.analysis.excludedForms({ bookId: context.bookId });
  throwIfAborted(signal);

  const worker = new Worker(new URL("analyze.worker.ts", import.meta.url), { type: "module" });
  const analyzer = Comlink.wrap<AnalyzeWorkerApi>(worker);
  try {
    onProgress(progressFor({ stage: "ranking", ratio: 0.2 }));
    const result = await analyzer.analyze({
      chapters: book.chapters.map((chapter) => ({ index: chapter.index, text: chapter.text })),
      language: context.language,
      level: context.level,
      startChapterIndex: resolveStartChapter({
        positionType: context.positionType,
        positionValue: context.positionValue,
        totalChapters: book.chapters.length,
      }),
      excluded,
      limit: CANDIDATE_POOL_SIZE,
    });
    throwIfAborted(signal);
    onProgress(progressFor({ stage: "ranking", ratio: 1 }));

    const items = result.candidates.map((candidate) => ({
      surface: candidate.surface,
      normalized: candidate.normalized,
      kind: candidate.kind,
      snippets: candidate.snippets,
      localDifficulty: candidate.difficulty,
      bookFrequency: candidate.bookFrequency,
      firstChapterIndex: candidate.firstChapterIndex,
      earliness: Math.min(1, Math.max(0, candidate.earliness)),
      usefulness: candidate.usefulness,
      storyImportance: candidate.storyImportance,
      frequencyWeight: candidate.frequencyWeight,
      priorityScore: candidate.priority,
    }));

    let saved = 0;
    let pendingCount = 0;
    const batchCount = Math.max(1, Math.ceil(items.length / SAVE_BATCH_SIZE));
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
      throwIfAborted(signal);
      onProgress(
        progressFor({
          stage: "saving",
          ratio: batchIndex / batchCount,
          detail: { current: batchIndex + 1, total: batchCount },
        }),
      );
      const response = await client.analysis.saveCandidates({
        bookId: context.bookId,
        items: items.slice(batchIndex * SAVE_BATCH_SIZE, (batchIndex + 1) * SAVE_BATCH_SIZE),
      });
      const { saved: savedInBatch, pendingCount: pendingAfterBatch } = response;
      saved += savedInBatch;
      pendingCount = pendingAfterBatch;
    }
    onProgress(progressFor({ stage: "saving", ratio: 1, pendingCandidates: pendingCount }));
    return { saved, pendingCount, frequencyListBundled: result.frequencyListBundled };
  } finally {
    worker.terminate();
  }
}

/**
 * Refine pending candidates into cards, one bounded server call at a time, until the target
 * number of cards exists, the backlog is empty, or the round limit is hit.
 */
export async function refinePendingCandidates({
  bookId,
  onProgress,
  signal,
  targetCards = INITIAL_CARD_TARGET,
  maxRounds = MAX_REFINE_ROUNDS_PER_RUN,
  initialPending = null,
}: {
  bookId: string;
  onProgress: (progress: PreparationProgress) => void;
  signal?: AbortSignal;
  targetCards?: number;
  maxRounds?: number;
  initialPending?: number | null;
}): Promise<RefinementOutcome> {
  const outcome: RefinementOutcome = {
    created: 0,
    unresolved: 0,
    pendingCount: initialPending ?? 0,
    rounds: 0,
  };
  const plannedRounds = Math.max(
    1,
    Math.min(maxRounds, Math.ceil(targetCards / REFINE_BATCH_SIZE)),
  );

  for (let round = 0; round < maxRounds; round += 1) {
    throwIfAborted(signal);
    onProgress(
      progressFor({
        stage: "writing",
        ratio: Math.min(0.95, round / plannedRounds),
        cardsCreated: outcome.created,
        pendingCandidates: outcome.pendingCount,
        detail: { current: round + 1, total: plannedRounds },
      }),
    );
    const result = await client.analysis.refineNext({ bookId, limit: REFINE_BATCH_SIZE });
    outcome.rounds += 1;
    outcome.created += result.created;
    outcome.unresolved += result.unresolved;
    outcome.pendingCount = result.pendingCount;

    if (result.pendingCount === 0 || outcome.created >= targetCards) {
      break;
    }
    if (result.processed > 0 && result.created === 0 && result.unresolved >= result.processed) {
      // Nothing came back from the provider this round. Stop instead of burning quota.
      break;
    }
  }

  onProgress(
    progressFor({
      stage: "writing",
      ratio: 1,
      cardsCreated: outcome.created,
      pendingCandidates: outcome.pendingCount,
    }),
  );
  return outcome;
}

/** Full first-time pipeline: rank, save, refine the first study set, and mark the book ready. */
export async function runInitialPreparation({
  book,
  context,
}: {
  book: ParsedBook;
  context: PreparationContext;
}): Promise<RefinementOutcome> {
  const saved = await rankAndSaveCandidates({ book, context });
  const outcome = await refinePendingCandidates({
    bookId: context.bookId,
    onProgress: context.onProgress,
    signal: context.signal,
    initialPending: saved.pendingCount,
  });
  if (outcome.created > 0 || outcome.pendingCount === 0) {
    await client.analysis.finalize({ bookId: context.bookId });
  }
  context.onProgress(
    progressFor({
      stage: "done",
      ratio: 1,
      cardsCreated: outcome.created,
      pendingCandidates: outcome.pendingCount,
    }),
  );
  return outcome;
}
