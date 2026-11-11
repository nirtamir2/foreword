import { describe, expect, it } from "vitest";
import {
  MAX_VIDEO_POLL_ERRORS,
  VIDEO_CLAIM_TIMEOUT_MS,
  canStartVideoJob,
  nextVideoPollState,
  videoPhase,
} from "./videoJobState";

const now = new Date("2026-01-01T00:10:00Z");

describe("videoPhase", () => {
  it("treats a claim without a job id as submitting, then abandoned after the timeout", () => {
    const fresh = {
      status: "QUEUED" as const,
      jobId: null,
      updatedAt: new Date(now.getTime() - 1000),
    };
    const stale = {
      status: "QUEUED" as const,
      jobId: null,
      updatedAt: new Date(now.getTime() - VIDEO_CLAIM_TIMEOUT_MS - 1),
    };
    expect(videoPhase({ record: fresh, now })).toBe("submitting");
    expect(videoPhase({ record: stale, now })).toBe("abandoned");
  });

  it("maps the terminal and running states", () => {
    expect(videoPhase({ record: null, now })).toBe("none");
    expect(videoPhase({ record: { status: "IN_PROGRESS", jobId: "j", updatedAt: now }, now })).toBe(
      "running",
    );
    expect(videoPhase({ record: { status: "COMPLETED", jobId: "j", updatedAt: now }, now })).toBe(
      "completed",
    );
    expect(videoPhase({ record: { status: "FAILED", jobId: null, updatedAt: now }, now })).toBe(
      "failed",
    );
  });
});

describe("canStartVideoJob", () => {
  it("never submits a second paid job while one is in flight, even with regenerate", () => {
    expect(canStartVideoJob({ phase: "submitting", regenerate: true })).toBe(false);
    expect(canStartVideoJob({ phase: "running", regenerate: true })).toBe(false);
  });

  it("regenerates completed clips only on request and retries failed or abandoned ones", () => {
    expect(canStartVideoJob({ phase: "completed", regenerate: false })).toBe(false);
    expect(canStartVideoJob({ phase: "completed", regenerate: true })).toBe(true);
    expect(canStartVideoJob({ phase: "failed", regenerate: false })).toBe(true);
    expect(canStartVideoJob({ phase: "abandoned", regenerate: false })).toBe(true);
    expect(canStartVideoJob({ phase: "none", regenerate: false })).toBe(true);
  });
});

describe("nextVideoPollState", () => {
  const running = { status: "IN_PROGRESS" as const, videoUrl: null, pollErrorCount: 0 };

  it("keeps a running job active on a transient poll error", () => {
    const next = nextVideoPollState({
      current: running,
      result: { ok: false, message: "timeout" },
    });
    expect(next).toEqual({
      status: "IN_PROGRESS",
      videoUrl: null,
      error: "timeout",
      pollErrorCount: 1,
    });
  });

  it("fails only after repeated consecutive poll errors", () => {
    const next = nextVideoPollState({
      current: { ...running, pollErrorCount: MAX_VIDEO_POLL_ERRORS - 1 },
      result: { ok: false, message: "down" },
    });
    expect(next.status).toBe("FAILED");
  });

  it("resets the error count on a successful poll", () => {
    const next = nextVideoPollState({
      current: { ...running, pollErrorCount: 3 },
      result: {
        ok: true,
        snapshot: { status: "completed", progress: 100, url: "https://v/1.mp4", error: null },
      },
    });
    expect(next).toEqual({
      status: "COMPLETED",
      videoUrl: "https://v/1.mp4",
      error: null,
      pollErrorCount: 0,
    });
  });

  it("does not report COMPLETED without a playable url", () => {
    const next = nextVideoPollState({
      current: running,
      result: {
        ok: true,
        snapshot: { status: "completed", progress: 100, url: null, error: null },
      },
    });
    expect(next.status).toBe("FAILED");
  });
});
