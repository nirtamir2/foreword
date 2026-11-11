import {
  ANALYSIS_TUNING,
  LEVEL_KNOWN_RANK,
  associationStrength,
  clamp01,
  combinePriority,
  difficultyFromRank,
  earlinessScore,
  frequencyWeight,
  storyImportanceScore,
} from "./scoring";
import { segmentSentences } from "./segmentSentences";
import { stopwordsFor } from "./stopwords";
import { tokenizeWordsWithCase } from "./tokenize";
import type { AnalyzeBookOptions, LearnerLevel, VocabularyCandidate } from "./types";

interface Occurrence {
  count: number;
  /** Mid-sentence occurrences written in lowercase; real names essentially never have any. */
  lowercaseCount: number;
  firstChapterIndex: number;
  snippets: Array<string>;
  /** Surface form as first seen in the book, used for display before AI refinement. */
  surface: string;
}

const LETTER = /\p{L}/u;
const ONLY_DIGITS_OR_SYMBOLS = /^[\p{N}\p{P}\p{S}]+$/u;

function truncateSnippet(sentence: string): string {
  const max = ANALYSIS_TUNING.snippetMaxLength;
  return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1).trimEnd()}…`;
}

function recordOccurrence({
  map,
  key,
  surface,
  chapterIndex,
  snippet,
  isLowercaseMidSentence,
}: {
  map: Map<string, Occurrence>;
  key: string;
  surface: string;
  chapterIndex: number;
  snippet: string;
  isLowercaseMidSentence: boolean;
}): void {
  const existing = map.get(key);
  if (existing == null) {
    map.set(key, {
      count: 1,
      lowercaseCount: isLowercaseMidSentence ? 1 : 0,
      firstChapterIndex: chapterIndex,
      snippets: [snippet],
      surface,
    });
    return;
  }
  existing.count += 1;
  if (isLowercaseMidSentence) {
    existing.lowercaseCount += 1;
  }
  if (
    existing.snippets.length < ANALYSIS_TUNING.maxSnippets &&
    !existing.snippets.includes(snippet)
  ) {
    existing.snippets.push(snippet);
  }
}

/**
 * A word that is (almost) never lowercase mid-sentence is a name. Frequency lists include many
 * surnames and places at deep ranks, so a rank alone does not clear a word; only common words
 * (inside the learner's known band) are trusted regardless of casing.
 */
function isLikelyProperNoun({
  occurrence,
  rank,
  level,
}: {
  occurrence: Occurrence;
  rank: number | null;
  level: LearnerLevel;
}): boolean {
  if (rank != null && rank <= LEVEL_KNOWN_RANK[level]) {
    return false;
  }
  return (
    occurrence.count >= 2 &&
    occurrence.lowercaseCount <= occurrence.count * ANALYSIS_TUNING.properNounLowercaseTolerance
  );
}

function isWordLike(token: string): boolean {
  return (
    token.length >= ANALYSIS_TUNING.minWordLength &&
    LETTER.test(token) &&
    !ONLY_DIGITS_OR_SYMBOLS.test(token)
  );
}

function averageDifficulty({
  parts,
  level,
  getRank,
  maxRank,
}: {
  parts: ReadonlyArray<string>;
  level: LearnerLevel;
  getRank: (word: string) => number | null;
  maxRank: number;
}): number | null {
  if (parts.length === 0) {
    return null;
  }
  const total = parts.reduce(
    (sum, part) => sum + difficultyFromRank({ rank: getRank(part), level, maxRank }),
    0,
  );
  return total / parts.length;
}

/**
 * Extract and rank vocabulary candidates from a book. Pure and deterministic; language
 * frequency data is injected so the package stays free of bundled word lists.
 *
 * Words are scored by how far they sit outside the learner's assumed vocabulary, how
 * early they appear relative to the reader's starting point, how often the book uses
 * them, and how distinctive they are for this story. Bigrams and trigrams become phrase
 * candidates when they co-occur strongly or match the curated phrase lexicon.
 */
export function analyzeBook(options: AnalyzeBookOptions): Array<VocabularyCandidate> {
  const { chapters, locale, level, startChapterIndex, frequency, excluded, phraseLexicon, limit } =
    options;
  const stopwords = stopwordsFor({ locale });
  const { getRank, maxRank } = frequency;

  const words = new Map<string, Occurrence>();
  const bigrams = new Map<string, Occurrence>();
  const trigrams = new Map<string, Occurrence>();

  for (const chapter of chapters) {
    const sentences = segmentSentences({ text: chapter.text, locale });
    for (const sentence of sentences) {
      const snippet = truncateSnippet(sentence);
      const tokens = tokenizeWordsWithCase({ text: sentence, locale });
      for (const [position, token] of tokens.entries()) {
        recordOccurrence({
          map: words,
          key: token.normalized,
          surface: token.normalized,
          chapterIndex: chapter.index,
          snippet,
          // Sentence-initial tokens are always capitalized, so only mid-sentence casing counts.
          isLowercaseMidSentence: position > 0 && !token.isCapitalized,
        });
        const next = tokens[position + 1];
        // oxlint-disable-next-line eslint-unicorn/prefer-continue -- keep nested loop traversal; continue conflicts with eslint-unicorn/no-break-in-nested-loop
        if (next != null) {
          const bigram = `${token.normalized} ${next.normalized}`;
          recordOccurrence({
            map: bigrams,
            key: bigram,
            surface: bigram,
            chapterIndex: chapter.index,
            snippet,
            isLowercaseMidSentence: false,
          });
          const afterNext = tokens[position + 2];
          if (afterNext != null) {
            const trigram = `${bigram} ${afterNext.normalized}`;
            recordOccurrence({
              map: trigrams,
              key: trigram,
              surface: trigram,
              chapterIndex: chapter.index,
              snippet,
              isLowercaseMidSentence: false,
            });
          }
        }
      }
    }
  }

  const candidates: Array<VocabularyCandidate> = [];

  for (const [normalized, occurrence] of words) {
    if (excluded.has(normalized) || stopwords.has(normalized) || !isWordLike(normalized)) {
      continue;
    }
    const rank = getRank(normalized);
    if (isLikelyProperNoun({ occurrence, rank, level })) {
      continue;
    }
    const difficulty = difficultyFromRank({ rank, level, maxRank });
    if (difficulty < ANALYSIS_TUNING.minWordDifficulty) {
      continue;
    }
    const scores = {
      difficulty,
      earliness: earlinessScore({
        firstChapterIndex: occurrence.firstChapterIndex,
        startChapterIndex,
      }),
      frequencyWeight: frequencyWeight({ count: occurrence.count }),
      usefulness: ANALYSIS_TUNING.wordUsefulness,
      storyImportance: storyImportanceScore({ rank, maxRank, count: occurrence.count }),
    };
    candidates.push({
      surface: occurrence.surface,
      normalized,
      kind: "word",
      bookFrequency: occurrence.count,
      firstChapterIndex: occurrence.firstChapterIndex,
      ...scores,
      priority: combinePriority(scores),
      snippets: occurrence.snippets,
    });
  }

  function considerPhrase({
    normalized,
    occurrence,
    minCount,
    association,
  }: {
    normalized: string;
    occurrence: Occurrence;
    minCount: number;
    association: number | null;
  }): void {
    if (excluded.has(normalized)) {
      return;
    }
    const parts = normalized.split(" ");
    const inLexicon = phraseLexicon.has(normalized);
    const contentParts = parts.filter((part) => !stopwords.has(part) && isWordLike(part));

    if (!inLexicon) {
      if (contentParts.length === 0 || occurrence.count < minCount) {
        return;
      }
      const first = parts.at(0);
      const last = parts.at(-1);
      // Phrases that start or end with a function word are fragments, not expressions.
      if (first == null || last == null || stopwords.has(first) || stopwords.has(last)) {
        return;
      }
      // Phrases built around a name ("lady catherine") teach nothing transferable.
      const containsName = parts.some((part) => {
        const wordOccurrence = words.get(part);
        return (
          wordOccurrence != null &&
          isLikelyProperNoun({ occurrence: wordOccurrence, rank: getRank(part), level })
        );
      });
      if (containsName) {
        return;
      }
      if (association != null && association < ANALYSIS_TUNING.phraseAssociationThreshold) {
        return;
      }
      // Phrases made of a single content word plus function words duplicate the word itself.
      if (contentParts.length < 2 && parts.every((part) => !phraseLexicon.has(part))) {
        return;
      }
    }

    const wordDifficulty =
      averageDifficulty({ parts: contentParts, level, getRank, maxRank }) ?? 0.3;
    const difficulty = inLexicon
      ? Math.max(ANALYSIS_TUNING.lexiconPhraseMinDifficulty, wordDifficulty)
      : clamp01(wordDifficulty + 0.1);
    const threshold = ANALYSIS_TUNING.phraseAssociationThreshold;
    const usefulness = inLexicon
      ? ANALYSIS_TUNING.lexiconPhraseUsefulness
      : 0.5 + 0.4 * clamp01(((association ?? threshold) - threshold) / (1 - threshold));

    const scores = {
      difficulty,
      earliness: earlinessScore({
        firstChapterIndex: occurrence.firstChapterIndex,
        startChapterIndex,
      }),
      frequencyWeight: frequencyWeight({ count: occurrence.count }),
      usefulness,
      storyImportance: storyImportanceScore({ rank: null, maxRank, count: occurrence.count }),
    };
    candidates.push({
      surface: occurrence.surface,
      normalized,
      kind: "phrase",
      bookFrequency: occurrence.count,
      firstChapterIndex: occurrence.firstChapterIndex,
      ...scores,
      priority: combinePriority(scores),
      snippets: occurrence.snippets,
    });
  }

  for (const [normalized, occurrence] of bigrams) {
    const [first, second] = normalized.split(" ", 2);
    if (first == null || second == null) {
      continue;
    }
    considerPhrase({
      normalized,
      occurrence,
      minCount: ANALYSIS_TUNING.minBigramCount,
      association: associationStrength({
        pairCount: occurrence.count,
        countA: words.get(first)?.count ?? occurrence.count,
        countB: words.get(second)?.count ?? occurrence.count,
      }),
    });
  }

  for (const [normalized, occurrence] of trigrams) {
    considerPhrase({
      normalized,
      occurrence,
      minCount: ANALYSIS_TUNING.minTrigramCount,
      association: null,
    });
  }

  candidates.sort((left, right) => right.priority - left.priority);
  return candidates.slice(0, limit);
}
