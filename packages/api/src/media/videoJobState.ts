import type { VideoStatus } from "@app-template/db";
import type { VideoJobSnapshot, VideoJobStatus } from "./videoService";

/** A claim that never got a provider job id within this window was abandoned by a crashed request. */
export const VIDEO_CLAIM_TIMEOUT_MS = 2 * 60 * 1000;
/** Consecutive failed status polls before a running clip is given up on. */
export const MAX_VIDEO_POLL_ERRORS = 5;

/**
 * - none: no clip was ever requested.
 * - submitting: a request owns the record and is submitting to the provider (no job id yet).
 * - abandoned: a submitting claim that timed out.
 * - running: the provider is generating the clip.
 */
export type VideoPhase = "none" | "submitting" | "abandoned" | "running" | "completed" | "failed";

interface VideoRecordLike {
  status: VideoStatus;
  jobId: string | null;
  updatedAt: Date;
}

export function videoPhase({
  record,
  now,
}: {
  record: VideoRecordLike | null;
  now: Date;
}): VideoPhase {
  if (record == null) {
    return "none";
  }
  switch (record.status) {
    case "COMPLETED": {
      return "completed";
    }
    case "FAILED": {
      return "failed";
    }
    case "QUEUED":
    case "IN_PROGRESS": {
      if (record.jobId != null) {
        return "running";
      }
      return now.getTime() - record.updatedAt.getTime() > VIDEO_CLAIM_TIMEOUT_MS
        ? "abandoned"
        : "submitting";
    }
  }
}

/** Whether a request may submit a new paid job. Never while another job is in flight. */
export function canStartVideoJob({
  phase,
  regenerate,
}: {
  phase: VideoPhase;
  regenerate: boolean;
}): boolean {
  switch (phase) {
    case "none":
    case "failed":
    case "abandoned": {
      return true;
    }
    case "completed": {
      return regenerate;
    }
    case "submitting":
    case "running": {
      return false;
    }
  }
}

function toDbStatus(status: VideoJobStatus): VideoStatus {
  switch (status) {
    case "pending": {
      return "QUEUED";
    }
    case "processing": {
      return "IN_PROGRESS";
    }
    case "completed": {
      return "COMPLETED";
    }
    case "failed": {
      return "FAILED";
    }
  }
}

export interface VideoPollUpdate {
  status: VideoStatus;
  videoUrl: string | null;
  error: string | null;
  pollErrorCount: number;
}

/**
 * Next stored state after one status poll. A poll that cannot reach the provider keeps the job
 * running (so polling continues) and only fails it after repeated consecutive errors.
 */
export function nextVideoPollState({
  current,
  result,
}: {
  current: { status: VideoStatus; videoUrl: string | null; pollErrorCount: number };
  result: { ok: true; snapshot: VideoJobSnapshot } | { ok: false; message: string };
}): VideoPollUpdate {
  if (!result.ok) {
    const pollErrorCount = current.pollErrorCount + 1;
    return {
      status: pollErrorCount >= MAX_VIDEO_POLL_ERRORS ? "FAILED" : current.status,
      videoUrl: current.videoUrl,
      error: result.message,
      pollErrorCount,
    };
  }
  const { snapshot } = result;
  const status = toDbStatus(snapshot.status);
  const videoUrl = snapshot.url ?? current.videoUrl;
  if (status === "COMPLETED" && videoUrl == null) {
    return {
      status: "FAILED",
      videoUrl: null,
      error: snapshot.error ?? "Video finished without a playable file",
      pollErrorCount: 0,
    };
  }
  return { status, videoUrl, error: snapshot.error, pollErrorCount: 0 };
}
