export interface FrequencyList {
  /** word → 1-based rank (1 = most common). */
  ranks: Map<string, number>;
  maxRank: number;
  /** Whether a real list was found for the language. */
  isBundled: boolean;
}

const FALLBACK_MAX_RANK = 50_000;

/**
 * Load a rank-ordered word list from `/freq/{language}.txt`. When a language is not bundled,
 * every word is treated as unfamiliar and the AI refinement takes over difficulty judgment.
 */
export async function loadFrequencyList({
  language,
}: {
  language: string;
}): Promise<FrequencyList> {
  try {
    const response = await fetch(`/freq/${language}.txt`);
    if (!response.ok) {
      return { ranks: new Map(), maxRank: FALLBACK_MAX_RANK, isBundled: false };
    }
    const text = await response.text();
    const ranks = new Map<string, number>();
    let rank = 0;
    for (const line of text.split("\n")) {
      const word = line.trim();
      if (word.length === 0) {
        continue;
      }
      rank += 1;
      if (!ranks.has(word)) {
        ranks.set(word, rank);
      }
    }
    return { ranks, maxRank: rank > 0 ? rank : FALLBACK_MAX_RANK, isBundled: rank > 0 };
  } catch {
    return { ranks: new Map(), maxRank: FALLBACK_MAX_RANK, isBundled: false };
  }
}
