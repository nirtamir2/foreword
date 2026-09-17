import { z } from "zod";

export const learnerLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const phraseTypeSchema = z.enum([
  "WORD",
  "COLLOCATION",
  "PHRASAL_VERB",
  "IDIOM",
  "PROPER_NOUN",
]);

export const refineItemInputSchema = z.object({
  id: z.string(),
  surface: z.string(),
  kind: z.enum(["word", "phrase"]),
  snippets: z.array(z.string()),
  localDifficulty: z.number(),
  localFrequency: z.number(),
});

export const refineInputSchema = z.object({
  bookLanguage: z.string(),
  nativeLanguage: z.string(),
  level: learnerLevelSchema,
  items: z.array(refineItemInputSchema),
});

export const refinedExampleSchema = z.object({
  source: z.string(),
  translation: z.string(),
});

export const refinedItemSchema = z.object({
  id: z.string(),
  lemma: z.string(),
  displayForm: z.string(),
  translation: z.string(),
  partOfSpeech: z.string(),
  phraseType: phraseTypeSchema,
  difficulty: z.number().min(0).max(1),
  usefulness: z.number().min(0).max(1),
  shouldSkip: z.boolean(),
  explanation: z.string(),
  examples: z.array(refinedExampleSchema),
});

export type RefineInput = z.infer<typeof refineInputSchema>;
export type RefineInputItem = z.infer<typeof refineItemInputSchema>;
export type RefinedItem = z.infer<typeof refinedItemSchema>;
export type PhraseType = z.infer<typeof phraseTypeSchema>;
