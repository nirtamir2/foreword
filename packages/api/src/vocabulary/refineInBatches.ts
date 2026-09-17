import { isProviderWideAiError, isTerminalAiError } from "./normalizeAiError";
import type { RefineInput, RefineInputItem, RefinedItem } from "./refinementSchema";

interface Props {
  input: RefineInput;
  refine: (input: RefineInput) => Promise<Array<RefinedItem>>;
  batchSize: number;
  maxAttempts?: number;
}

export interface BatchRefinementResult {
  refined: Array<RefinedItem>;
  /** Items that received no answer even after retries; keep their candidates pending. */
  unresolvedIds: Array<string>;
  firstError: unknown;
}

const RETRY_BASE_DELAY_MS = 750;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chunk<T>(items: ReadonlyArray<T>, size: number): Array<Array<T>> {
  const chunks: Array<Array<T>> = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

async function refineWithRetry({
  input,
  refine,
  maxAttempts,
}: {
  input: RefineInput;
  refine: Props["refine"];
  maxAttempts: number;
}): Promise<Array<RefinedItem>> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await refine(input);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || isTerminalAiError(error)) {
        throw error;
      }
      await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

/** Refine one batch, re-asking once for any items the model silently dropped. */
async function refineBatch({
  input,
  items,
  refine,
  maxAttempts,
}: {
  input: RefineInput;
  items: Array<RefineInputItem>;
  refine: Props["refine"];
  maxAttempts: number;
}): Promise<BatchRefinementResult> {
  const wanted = new Set(items.map((item) => item.id));
  const byId = new Map<string, RefinedItem>();
  let recoveryError: unknown = null;

  function collect(results: Array<RefinedItem>) {
    for (const result of results) {
      if (wanted.has(result.id) && !byId.has(result.id)) {
        byId.set(result.id, result);
      }
    }
  }

  collect(await refineWithRetry({ input: { ...input, items }, refine, maxAttempts }));

  const missing = items.filter((item) => !byId.has(item.id));
  if (missing.length > 0) {
    try {
      collect(await refineWithRetry({ input: { ...input, items: missing }, refine, maxAttempts }));
    } catch (error) {
      recoveryError = error;
    }
  }

  const unresolvedIds = items.filter((item) => !byId.has(item.id)).map((item) => item.id);
  return {
    refined: items.flatMap((item) => {
      const result = byId.get(item.id);
      return result == null ? [] : [result];
    }),
    unresolvedIds,
    firstError:
      unresolvedIds.length > 0
        ? (recoveryError ??
          new Error(`AI returned no card for ${String(unresolvedIds.length)} candidates.`))
        : null,
  };
}

/** On a batch-level failure, split it in half and try each half so one bad item cannot sink a batch. */
async function refineBatchOrSplit(options: {
  input: RefineInput;
  items: Array<RefineInputItem>;
  refine: Props["refine"];
  maxAttempts: number;
}): Promise<BatchRefinementResult> {
  try {
    return await refineBatch(options);
  } catch (error) {
    if (options.items.length <= 1 || isProviderWideAiError(error)) {
      return {
        refined: [],
        unresolvedIds: options.items.map((item) => item.id),
        firstError: error,
      };
    }
    const halves = chunk(options.items, Math.ceil(options.items.length / 2));
    const merged: BatchRefinementResult = { refined: [], unresolvedIds: [], firstError: null };
    for (const half of halves) {
      const result = await refineBatchOrSplit({ ...options, items: half });
      merged.refined.push(...result.refined);
      merged.unresolvedIds.push(...result.unresolvedIds);
      merged.firstError ??= result.firstError;
    }
    return merged;
  }
}

/**
 * Refine candidates in bounded serial batches. Provider calls stay sequential because
 * rate limits are the most common failure; steady beats bursty here.
 */
export async function refineInBatches({
  input,
  refine,
  batchSize,
  maxAttempts = 3,
}: Props): Promise<BatchRefinementResult> {
  const result: BatchRefinementResult = { refined: [], unresolvedIds: [], firstError: null };
  for (const items of chunk(input.items, Math.max(1, batchSize))) {
    const batch = await refineBatchOrSplit({ input, items, refine, maxAttempts });
    result.refined.push(...batch.refined);
    result.unresolvedIds.push(...batch.unresolvedIds);
    result.firstError ??= batch.firstError;
    if (batch.firstError != null && isProviderWideAiError(batch.firstError)) {
      // Nothing else in this run will succeed; leave the rest pending for a later resume.
      const remaining = input.items.filter(
        (item) =>
          !result.refined.some((refined) => refined.id === item.id) &&
          !result.unresolvedIds.includes(item.id),
      );
      result.unresolvedIds.push(...remaining.map((item) => item.id));
      break;
    }
  }
  return result;
}
