import type { LearnerLevel, ScoreBreakdown } from "./types";

/** Relative weight of each signal in the final priority. Sums to 1. */
export const PRIORITY_WEIGHTS = {
  difficulty: 0.3,
  earliness: 0.25,
  frequencyWeight: 0.2,
  usefulness: 0.15,
  storyImportance: 0.1,
} as const satisfies Record<keyof ScoreBreakdown, number>;

/** Frequency rank a learner at each level is assumed to already know. */
export const LEVEL_KNOWN_RANK: Record<LearnerLevel, number> = {
  BEGINNER: 1200,
  INTERMEDIATE: 4000,
  ADVANCED: 10_000,
};

export const ANALYSIS_TUNING = {
  minWordDifficulty: 0.15,
  minWordLength: 3,
  minBigramCount: 3,
  minTrigramCount: 2,
  phraseAssociationThreshold: 0.18,
  earlinessHorizonChapters: 3,
  frequencyCap: 40,
  unknownRankDifficulty: 0.85,
  maxSnippets: 2,
  snippetMaxLength: 180,
  wordUsefulness: 0.45,
  lexiconPhraseUsefulness: 0.9,
  lexiconPhraseMinDifficulty: 0.45,
  /** Max share of lowercase mid-sentence occurrences an unranked word may have and still count as a name. */
  properNounLowercaseTolerance: 0.05,
} as const;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * 0 when the word is inside the learner's assumed vocabulary, rising toward 1 as the
 * word gets rarer than that band.
 */
export function difficultyFromRank({
  rank,
  level,
  maxRank,
}: {
  rank: number | null;
  level: LearnerLevel;
  maxRank: number;
}): number {
  if (rank == null) {
    return ANALYSIS_TUNING.unknownRankDifficulty;
  }
  const knownRank = LEVEL_KNOWN_RANK[level];
  if (rank <= knownRank) {
    return 0;
  }
  if (maxRank <= knownRank) {
    return 1;
  }
  return clamp01(
    (Math.log(rank) - Math.log(knownRank)) / (Math.log(maxRank) - Math.log(knownRank)),
  );
}

/** Words that appear soon after the reader's starting point matter most; earlier chapters fade. */
export function earlinessScore({
  firstChapterIndex,
  startChapterIndex,
}: {
  firstChapterIndex: number;
  startChapterIndex: number;
}): number {
  const distance = firstChapterIndex - startChapterIndex;
  const horizon = ANALYSIS_TUNING.earlinessHorizonChapters;
  return distance >= 0 ? Math.exp(-distance / horizon) : 0.2 * Math.exp(distance / horizon);
}

/** Log-scaled in-book frequency, capped so a name repeated 500 times does not dominate. */
export function frequencyWeight({ count }: { count: number }): number {
  return clamp01(Math.log1p(count) / Math.log1p(ANALYSIS_TUNING.frequencyCap));
}

/** Rare in general language but frequent in this book: likely a key term of the story. */
export function storyImportanceScore({
  rank,
  maxRank,
  count,
}: {
  rank: number | null;
  maxRank: number;
  count: number;
}): number {
  const rarity = rank == null ? 1 : clamp01(rank / maxRank);
  return clamp01(rarity * frequencyWeight({ count }));
}

export function combinePriority(scores: ScoreBreakdown): number {
  return (
    PRIORITY_WEIGHTS.difficulty * scores.difficulty +
    PRIORITY_WEIGHTS.earliness * scores.earliness +
    PRIORITY_WEIGHTS.frequencyWeight * scores.frequencyWeight +
    PRIORITY_WEIGHTS.usefulness * scores.usefulness +
    PRIORITY_WEIGHTS.storyImportance * scores.storyImportance
  );
}

/** Dice coefficient: how strongly two words co-occur relative to how often each appears. */
export function associationStrength({
  pairCount,
  countA,
  countB,
}: {
  pairCount: number;
  countA: number;
  countB: number;
}): number {
  const total = countA + countB;
  return total === 0 ? 0 : (2 * pairCount) / total;
}
