const segmenterCache = new Map<string, Intl.Segmenter>();

function sentenceSegmenter({ locale }: { locale: string }): Intl.Segmenter {
  const cached = segmenterCache.get(locale);
  if (cached != null) {
    return cached;
  }
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  segmenterCache.set(locale, segmenter);
  return segmenter;
}

/** Trimmed, non-empty sentences in reading order. */
export function segmentSentences({
  text,
  locale,
}: {
  text: string;
  locale: string;
}): Array<string> {
  const sentences: Array<string> = [];
  const segments = sentenceSegmenter({ locale }).segment(text);
  for (const segment of segments) {
    const sentence = segment.segment.replaceAll(/\s+/g, " ").trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
  }
  return sentences;
}
