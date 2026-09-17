export type PreparationStage = "reading" | "detecting" | "ranking" | "saving" | "writing" | "done";

export interface PreparationProgress {
  stage: PreparationStage;
  /** Overall 0-100 estimate for a single progress bar. */
  percent: number;
  /** Cards written so far in this run. */
  cardsCreated: number;
  /** Candidates still waiting for refinement, when known. */
  pendingCandidates: number | null;
  /** Stage-specific detail such as "batch 2 of 3". */
  detail: { current: number; total: number } | null;
}

export const PREPARATION_STAGES: ReadonlyArray<PreparationStage> = [
  "reading",
  "detecting",
  "ranking",
  "saving",
  "writing",
  "done",
];

const STAGE_BASE_PERCENT: Record<PreparationStage, number> = {
  reading: 2,
  detecting: 12,
  ranking: 18,
  saving: 40,
  writing: 52,
  done: 100,
};

const STAGE_SPAN_PERCENT: Record<PreparationStage, number> = {
  reading: 10,
  detecting: 6,
  ranking: 22,
  saving: 12,
  writing: 48,
  done: 0,
};

export function progressFor({
  stage,
  ratio = 0,
  cardsCreated = 0,
  pendingCandidates = null,
  detail = null,
}: {
  stage: PreparationStage;
  ratio?: number;
  cardsCreated?: number;
  pendingCandidates?: number | null;
  detail?: { current: number; total: number } | null;
}): PreparationProgress {
  const clamped = Math.min(1, Math.max(0, ratio));
  return {
    stage,
    percent: Math.round(STAGE_BASE_PERCENT[stage] + STAGE_SPAN_PERCENT[stage] * clamped),
    cardsCreated,
    pendingCandidates,
    detail,
  };
}
