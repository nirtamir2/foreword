import { combinePriority } from "@app-template/text-analysis";
import type { RefinedItem } from "./refinementSchema";

export interface StoredCandidate {
  id: string;
  surface: string;
  normalized: string;
  kind: "word" | "phrase";
  snippets: Array<string>;
  localDifficulty: number;
  bookFrequency: number;
  firstChapterIndex: number;
  earliness: number;
  usefulness: number;
  storyImportance: number;
  frequencyWeight: number;
  priorityScore: number;
}

export interface CardDraft {
  candidateId: string;
  headword: string;
  displayForm: string;
  lemma: string;
  isPhrase: boolean;
  phraseType: RefinedItem["phraseType"];
  partOfSpeech: string;
  translation: string;
  explanation: string;
  examples: RefinedItem["examples"];
  difficulty: number;
  usefulness: number;
  bookFrequency: number;
  firstChapterIndex: number;
  priorityScore: number;
}

export interface RefinementPlan {
  cards: Array<CardDraft>;
  refinedIds: Array<string>;
  skippedIds: Array<string>;
  duplicateIds: Array<string>;
  unresolvedIds: Array<string>;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Decide what happens to each candidate given the AI answers and the cards that already exist. */
export function planCandidateRefinement({
  candidates,
  refined,
  existingHeadwords,
}: {
  candidates: ReadonlyArray<StoredCandidate>;
  refined: ReadonlyArray<RefinedItem>;
  existingHeadwords: ReadonlySet<string>;
}): RefinementPlan {
  const refinedById = new Map(refined.map((item) => [item.id, item]));
  const plan: RefinementPlan = {
    cards: [],
    refinedIds: [],
    skippedIds: [],
    duplicateIds: [],
    unresolvedIds: [],
  };
  const claimedHeadwords = new Set<string>();

  for (const candidate of candidates) {
    const headword = normalizeKey(candidate.normalized);
    if (existingHeadwords.has(headword) || claimedHeadwords.has(headword)) {
      plan.duplicateIds.push(candidate.id);
      continue;
    }
    const result = refinedById.get(candidate.id);
    if (result == null) {
      plan.unresolvedIds.push(candidate.id);
      continue;
    }
    if (result.shouldSkip) {
      plan.skippedIds.push(candidate.id);
      continue;
    }
    claimedHeadwords.add(headword);
    plan.refinedIds.push(candidate.id);
    plan.cards.push({
      candidateId: candidate.id,
      headword,
      displayForm: result.displayForm,
      lemma: result.lemma,
      isPhrase: candidate.kind === "phrase",
      phraseType: result.phraseType,
      partOfSpeech: result.partOfSpeech,
      translation: result.translation,
      explanation: result.explanation,
      examples: result.examples,
      difficulty: result.difficulty,
      usefulness: result.usefulness,
      bookFrequency: candidate.bookFrequency,
      firstChapterIndex: candidate.firstChapterIndex,
      priorityScore: combinePriority({
        difficulty: result.difficulty,
        earliness: candidate.earliness,
        frequencyWeight: candidate.frequencyWeight,
        usefulness: result.usefulness,
        storyImportance: candidate.storyImportance,
      }),
    });
  }

  return plan;
}

/** Push unanswered candidates below everything else so the next run tries fresh ones first. */
export function demotedPriority({
  candidates,
}: {
  candidates: ReadonlyArray<StoredCandidate>;
}): number {
  if (candidates.length === 0) {
    return 0;
  }
  return Math.min(...candidates.map((candidate) => candidate.priorityScore)) - 1;
}
