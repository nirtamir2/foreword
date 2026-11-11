export interface CardExample {
  source: string;
  translation: string;
}

/** Coerce stored JSON into typed examples at the API boundary. */
export function toExamples(value: unknown): Array<CardExample> {
  if (!Array.isArray(value)) {
    return [];
  }
  const examples: Array<CardExample> = [];
  for (const entry of value) {
    if (entry == null || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.source === "string") {
      examples.push({
        source: record.source,
        translation: typeof record.translation === "string" ? record.translation : "",
      });
    }
  }
  return examples;
}

export function toStringArray(value: unknown): Array<string> {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
