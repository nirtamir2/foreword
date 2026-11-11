import { describe, expect, it } from "vitest";
import { nextAnalysisStatus } from "./nextAnalysisStatus";

describe("nextAnalysisStatus", () => {
  it("stays resumable while candidates are pending and no cards exist", () => {
    expect(nextAnalysisStatus({ current: "ANALYZING", cardCount: 0, pendingCount: 5 })).toBe(
      "ANALYZING",
    );
  });

  it("is READY once cards exist", () => {
    expect(nextAnalysisStatus({ current: "ANALYZING", cardCount: 3, pendingCount: 5 })).toBe(
      "READY",
    );
  });

  it("is READY (empty) once the backlog is exhausted", () => {
    expect(nextAnalysisStatus({ current: "PENDING", cardCount: 0, pendingCount: 0 })).toBe("READY");
  });

  it("never regresses from READY", () => {
    expect(nextAnalysisStatus({ current: "READY", cardCount: 0, pendingCount: 9 })).toBe("READY");
  });
});
