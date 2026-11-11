import { describe, expect, it } from "vitest";
import { MAX_REFINE_ATTEMPTS, planUnresolvedCandidates } from "./planUnresolvedCandidates";

describe("planUnresolvedCandidates", () => {
  it("retries candidates below the attempt budget and counts the attempt", () => {
    const plan = planUnresolvedCandidates({
      unresolved: [{ id: "a", refineAttempts: 0 }],
      isProviderWideFailure: false,
    });
    expect(plan).toEqual({ retryIds: ["a"], exhaustedIds: [], countsAsAttempt: true });
  });

  it("moves a candidate to UNRESOLVED on its last allowed attempt", () => {
    const plan = planUnresolvedCandidates({
      unresolved: [
        { id: "fresh", refineAttempts: 0 },
        { id: "poison", refineAttempts: MAX_REFINE_ATTEMPTS - 1 },
      ],
      isProviderWideFailure: false,
    });
    expect(plan.retryIds).toEqual(["fresh"]);
    expect(plan.exhaustedIds).toEqual(["poison"]);
  });

  it("never spends attempts on provider-wide failures", () => {
    const plan = planUnresolvedCandidates({
      unresolved: [{ id: "a", refineAttempts: MAX_REFINE_ATTEMPTS - 1 }],
      isProviderWideFailure: true,
    });
    expect(plan).toEqual({ retryIds: ["a"], exhaustedIds: [], countsAsAttempt: false });
  });
});
