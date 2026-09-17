const segmenterCache = new Map<string, Intl.Segmenter>();

function wordSegmenter({ locale }: { locale: string }): Intl.Segmenter {
  const cached = segmenterCache.get(locale);
  if (cached != null) {
    return cached;
  }
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  segmenterCache.set(locale, segmenter);
  return segmenter;
}

const APOSTROPHES = /[’ʼ]/g;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const ENGLISH_POSSESSIVE = /'s$/;

/** The code point that ends at `end`, respecting surrogate pairs. */
function lastCharacterBefore({ value, end }: { value: string; end: number }): string {
  const trailing = value.codePointAt(end - 1) ?? 0;
  if (trailing >= 0xdc_00 && trailing <= 0xdf_ff && end >= 2) {
    const pair = value.codePointAt(end - 2) ?? 0;
    if (pair > 0xff_ff) {
      return value.slice(end - 2, end);
    }
  }
  return value.slice(end - 1, end);
}

/** Strip punctuation, quotes and markup underscores from both ends without regex backtracking. */
function trimEdges(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const character = String.fromCodePoint(value.codePointAt(start) ?? 0);
    if (WORD_CHARACTER.test(character)) {
      break;
    }
    start += character.length;
  }
  while (end > start) {
    const character = lastCharacterBefore({ value, end });
    if (WORD_CHARACTER.test(character)) {
      break;
    }
    end -= character.length;
  }
  return value.slice(start, end);
}

export interface WordToken {
  /** Lowercased, trimmed form used as the dictionary key. */
  normalized: string;
  /** Whether the token started with an uppercase letter in the source text. */
  isCapitalized: boolean;
}

/** Normalize one raw segment: strip stray punctuation/underscores and English possessives. */
export function normalizeToken({ raw, locale }: { raw: string; locale: string }): string {
  let token = trimEdges(raw.replaceAll(APOSTROPHES, "'"));
  if (locale.startsWith("en")) {
    token = token.replace(ENGLISH_POSSESSIVE, "");
  }
  return token.toLocaleLowerCase(locale);
}

/**
 * Lowercased word-like tokens for a sentence. `Intl.Segmenter` handles word boundaries
 * across scripts without shipping a tokenizer per language.
 */
export function tokenizeWords({ text, locale }: { text: string; locale: string }): Array<string> {
  return tokenizeWordsWithCase({ text, locale }).map((token) => token.normalized);
}

/** Tokens with casing information, used for proper-noun detection. */
export function tokenizeWordsWithCase({
  text,
  locale,
}: {
  text: string;
  locale: string;
}): Array<WordToken> {
  const tokens: Array<WordToken> = [];
  for (const segment of wordSegmenter({ locale }).segment(text)) {
    if (segment.isWordLike !== true) {
      continue;
    }
    const normalized = normalizeToken({ raw: segment.segment, locale });
    if (normalized.length === 0) {
      continue;
    }
    const first = trimEdges(segment.segment).charAt(0);
    tokens.push({ normalized, isCapitalized: first !== first.toLocaleLowerCase(locale) });
  }
  return tokens;
}
