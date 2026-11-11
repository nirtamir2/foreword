/** After this many runs without an AI answer a candidate becomes UNRESOLVED and is never retried. */
export const MAX_REFINE_ATTEMPTS = 3;

export interface UnresolvedPlan {
  /** Stay PENDING, demoted below every other pending candidate. */
  retryIds: Array<string>;
  /** Move to the terminal UNRESOLVED status. */
  exhaustedIds: Array<string>;
  /** Whether this run counts against each candidate's attempt budget. */
  countsAsAttempt: boolean;
}

/**
 * Decide what happens to candidates the AI did not answer. Provider-wide failures (quota, auth,
 * outage) are not the candidate's fault, so they never use up its attempts.
 */
export function planUnresolvedCandidates({
  unresolved,
  isProviderWideFailure,
  maxAttempts = MAX_REFINE_ATTEMPTS,
}: {
  unresolved: ReadonlyArray<{ id: string; refineAttempts: number }>;
  isProviderWideFailure: boolean;
  maxAttempts?: number;
}): UnresolvedPlan {
  const plan: UnresolvedPlan = {
    retryIds: [],
    exhaustedIds: [],
    countsAsAttempt: !isProviderWideFailure,
  };
  for (const candidate of unresolved) {
    if (plan.countsAsAttempt && candidate.refineAttempts + 1 >= maxAttempts) {
      plan.exhaustedIds.push(candidate.id);
    } else {
      plan.retryIds.push(candidate.id);
    }
  }
  return plan;
}
