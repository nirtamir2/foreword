import { chat } from "@tanstack/ai";
import { GEMINI_MODELS, createGeminiChat } from "@tanstack/ai-gemini";
import type { GeminiTextModel } from "@tanstack/ai-gemini";
import { z } from "zod";
import { refinedItemSchema } from "./refinementSchema";
import type { RefineInput, RefinedItem } from "./refinementSchema";

const MAX_OUTPUT_TOKENS = 16_000;

const SYSTEM_PROMPT = `You are an expert language tutor preparing a learner to read a specific book.
You receive candidate words and phrases extracted from the book together with short snippets showing how the book uses them.

For every candidate return one study card:
- "id": echo the candidate id exactly.
- "lemma": canonical dictionary form, lowercase, in the book language.
- "displayForm": how the entry should be shown on a card (the lemma, with natural capitalization for proper nouns).
- "translation": the meaning in the learner's native language, concise (1-4 words when possible).
- "partOfSpeech": noun, verb, adjective, adverb, phrasal verb, idiom, expression, etc.
- "phraseType": WORD, COLLOCATION, PHRASAL_VERB, IDIOM, or PROPER_NOUN.
- "difficulty": 0-1 for a learner at the stated level (0 trivial, 1 very hard).
- "usefulness": 0-1 for how valuable it is to learn before reading. Idioms, phrasal verbs and recurring content words score high; rare names and typos score low.
- "shouldSkip": true for names of people or places, typos, numbers, fragments that are not real expressions, or vocabulary that is trivial for the level.
- "explanation": one short sentence in the learner's native language explaining meaning or usage as it appears in this book.
- "examples": one or two short examples. "source" is a sentence in the book language (adapt the snippet when it reads well), "translation" is in the native language.

Answer every item. Return JSON only.`;

const laxString = z.preprocess((value) => value ?? "", z.coerce.string());
const laxScore = z.preprocess(
  (value) => (value == null || value === "" ? 0 : value),
  z.coerce.number(),
);
const laxBoolean = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return value ?? false;
}, z.boolean());
function toArray(value: unknown): Array<unknown> {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? (value as Array<unknown>) : [value];
}

const laxExamples = z.preprocess(
  toArray,
  z.array(z.object({ source: laxString, translation: laxString })),
);

/** Tolerant shape for the provider response; values are normalized in sanitize(). */
const laxRefinedItemSchema = z.object({
  id: laxString,
  lemma: laxString,
  displayForm: laxString,
  translation: laxString,
  partOfSpeech: laxString,
  phraseType: laxString,
  difficulty: laxScore,
  usefulness: laxScore,
  shouldSkip: laxBoolean,
  explanation: laxString,
  examples: laxExamples,
});

const batchOutputSchema = z.object({ items: z.array(laxRefinedItemSchema) });

interface Props {
  apiKey: string | null;
  model: string;
  input: RefineInput;
}

function clampScore(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

function normalizePhraseType({
  value,
  kind,
}: {
  value: string;
  kind: RefineInput["items"][number]["kind"];
}): RefinedItem["phraseType"] {
  const parsed = refinedItemSchema.shape.phraseType.safeParse(
    value
      .trim()
      .toUpperCase()
      .replaceAll(/[\s-]+/g, "_"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return kind === "phrase" ? "COLLOCATION" : "WORD";
}

/** Drop hallucinated ids, duplicates, and cards without the text needed to study them. */
function sanitize({
  items,
  input,
}: {
  items: ReadonlyArray<z.infer<typeof laxRefinedItemSchema>>;
  input: RefineInput;
}): Array<RefinedItem> {
  const requested = new Map(input.items.map((item) => [item.id, item]));
  const accepted = new Map<string, RefinedItem>();
  for (const item of items) {
    const request = requested.get(item.id);
    if (request == null || accepted.has(item.id)) {
      continue;
    }
    const hasText = item.translation.trim().length > 0 && item.explanation.trim().length > 0;
    if (!hasText && !item.shouldSkip) {
      continue;
    }
    const lemma = item.lemma.trim().length > 0 ? item.lemma.trim() : request.surface;
    accepted.set(item.id, {
      id: item.id,
      lemma,
      displayForm: item.displayForm.trim().length > 0 ? item.displayForm.trim() : lemma,
      translation: item.translation.trim(),
      partOfSpeech: item.partOfSpeech.trim(),
      phraseType: normalizePhraseType({ value: item.phraseType, kind: request.kind }),
      difficulty: clampScore(item.difficulty),
      usefulness: clampScore(item.usefulness),
      shouldSkip: item.shouldSkip,
      explanation: item.explanation.trim(),
      examples: item.examples
        .filter((example) => example.source.trim().length > 0)
        .slice(0, 2)
        .map((example) => ({
          source: example.source.trim(),
          translation: example.translation.trim(),
        })),
    });
  }
  // oxlint-disable-next-line eslint-unicorn/prefer-iterator-to-array -- `Iterator#toArray` is not in the TS lib of apps/web, which also type-checks this package
  return [...accepted.values()];
}

/**
 * Offline fallback used when no AI key is configured: cards carry the book snippet and a
 * visible placeholder translation so the whole flow stays demonstrable.
 */
function placeholderRefinement(input: RefineInput): Array<RefinedItem> {
  return input.items.map((item) => ({
    id: item.id,
    lemma: item.surface.toLocaleLowerCase(),
    displayForm: item.surface,
    translation: `[${input.nativeLanguage}] ${item.surface}`,
    partOfSpeech: item.kind === "phrase" ? "expression" : "word",
    phraseType: item.kind === "phrase" ? "COLLOCATION" : "WORD",
    difficulty: clampScore(item.localDifficulty),
    usefulness: item.kind === "phrase" ? 0.7 : 0.5,
    shouldSkip: false,
    explanation: `Configure AI_API_KEY to generate a real explanation for “${item.surface}”.`,
    examples: item.snippets.slice(0, 1).map((snippet) => ({ source: snippet, translation: "" })),
  }));
}

function resolveGeminiModel({ model }: { model: string }): GeminiTextModel {
  if (GEMINI_MODELS.includes(model as GeminiTextModel)) {
    return model as GeminiTextModel;
  }
  throw new Error(
    `Unsupported Gemini model "${model}". Supported models: ${GEMINI_MODELS.join(", ")}.`,
  );
}

export async function refineVocabulary({
  apiKey,
  model,
  input,
}: Props): Promise<Array<RefinedItem>> {
  if (input.items.length === 0) {
    return [];
  }
  if (apiKey == null || apiKey.length === 0) {
    return placeholderRefinement(input);
  }

  const response = await chat({
    adapter: createGeminiChat(resolveGeminiModel({ model }), apiKey),
    systemPrompts: [SYSTEM_PROMPT],
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          bookLanguage: input.bookLanguage,
          nativeLanguage: input.nativeLanguage,
          learnerLevel: input.level,
          items: input.items,
        }),
      },
    ],
    modelOptions: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    },
    outputSchema: batchOutputSchema,
  });

  return sanitize({ items: batchOutputSchema.parse(response).items, input });
}
