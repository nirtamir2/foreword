export type LearnerLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type CandidateKind = "word" | "phrase";

export interface ChapterInput {
  index: number;
  text: string;
}

export interface FrequencyLookup {
  /** 1-based rank in a general-language frequency list, or null when unknown. */
  getRank: (normalized: string) => number | null;
  /** Rank of the rarest word in the list. */
  maxRank: number;
}

export interface AnalyzeBookOptions {
  chapters: ReadonlyArray<ChapterInput>;
  /** Language of the book text (BCP-47 / ISO 639-1), used for segmentation. */
  locale: string;
  level: LearnerLevel;
  /** 0-based chapter index the reader will start from. */
  startChapterIndex: number;
  frequency: FrequencyLookup;
  /** Normalized forms to skip (already known words, existing cards, saved candidates). */
  excluded: ReadonlySet<string>;
  /** Curated multi-word expressions to surface even when statistically weak. */
  phraseLexicon: ReadonlySet<string>;
  /** How many candidates to return, best first. */
  limit: number;
}

export interface ScoreBreakdown {
  difficulty: number;
  earliness: number;
  frequencyWeight: number;
  usefulness: number;
  storyImportance: number;
}

export interface VocabularyCandidate extends ScoreBreakdown {
  surface: string;
  normalized: string;
  kind: CandidateKind;
  bookFrequency: number;
  firstChapterIndex: number;
  priority: number;
  snippets: Array<string>;
}
