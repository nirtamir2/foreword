import { describe, expect, it } from "vitest";
import { demotedPriority } from "./planCandidateRefinement";

describe("demotedPriority", () => {
  it("drops below the lowest pending priority of the whole book", () => {
    expect(demotedPriority({ lowestPendingPriority: 0.2 })).toBeCloseTo(-0.8);
  });

  it("handles a book with no other pending candidates", () => {
    expect(demotedPriority({ lowestPendingPriority: null })).toBe(-1);
  });
});
