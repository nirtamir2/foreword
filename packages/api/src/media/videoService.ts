import { chat, generateVideo, getVideoJobStatus } from "@tanstack/ai";
import { falVideo } from "@tanstack/ai-fal";
import { GEMINI_MODELS, createGeminiChat } from "@tanstack/ai-gemini";
import type { GeminiTextModel } from "@tanstack/ai-gemini";
import { z } from "zod";

export interface VideoPromptInput {
  displayForm: string;
  translation: string;
  explanation: string;
  partOfSpeech: string | null;
  bookLanguage: string;
  example: string | null;
}

export type VideoJobStatus = "pending" | "processing" | "completed" | "failed";

export interface VideoJobSnapshot {
  status: VideoJobStatus;
  progress: number | null;
  url: string | null;
  error: string | null;
}

export interface VideoService {
  isConfigured: boolean;
  model: string;
  buildPrompt: (input: VideoPromptInput) => Promise<string>;
  submit: (input: { prompt: string }) => Promise<{ jobId: string }>;
  status: (input: { jobId: string }) => Promise<VideoJobSnapshot>;
}

interface Props {
  apiKey: string | null;
  model: string;
  promptApiKey: string | null;
  promptModel: string;
}

const scenePromptSchema = z.object({ prompt: z.string() });

const SCENE_SYSTEM_PROMPT = `You write prompts for a text-to-video model that produces 5-second silent clips.
Given a vocabulary word and its meaning, describe ONE vivid, concrete, literal scene that makes the meaning obvious without any text on screen.
Rules: no on-screen text, no captions, no letters. One continuous shot, cinematic lighting, realistic style, a single clear subject and action. Under 60 words. Output only the prompt.`;

function fallbackPrompt(input: VideoPromptInput): string {
  const sense = input.explanation.length > 0 ? input.explanation : input.translation;
  return `A cinematic 5 second shot that visually illustrates the meaning of "${input.displayForm}" (${sense}). One clear subject, one clear action, realistic style, soft natural light, shallow depth of field. No text, no captions.`;
}

function resolveGeminiModel({ model }: { model: string }): GeminiTextModel | null {
  return GEMINI_MODELS.includes(model as GeminiTextModel) ? (model as GeminiTextModel) : null;
}

export function createVideoService({
  apiKey,
  model,
  promptApiKey,
  promptModel,
}: Props): VideoService {
  const isConfigured = apiKey != null && apiKey.length > 0;
  const adapter = isConfigured ? falVideo(model, { apiKey }) : null;
  const geminiModel = resolveGeminiModel({ model: promptModel });

  return {
    isConfigured,
    model,
    async buildPrompt(input) {
      if (promptApiKey == null || geminiModel == null) {
        return fallbackPrompt(input);
      }
      try {
        const result = await chat({
          adapter: createGeminiChat(geminiModel, promptApiKey),
          systemPrompts: [SCENE_SYSTEM_PROMPT],
          messages: [
            {
              role: "user",
              content: JSON.stringify({
                word: input.displayForm,
                language: input.bookLanguage,
                partOfSpeech: input.partOfSpeech,
                meaning: input.translation,
                explanation: input.explanation,
                exampleFromBook: input.example,
              }),
            },
          ],
          modelOptions: { temperature: 0.7, maxOutputTokens: 300 },
          outputSchema: scenePromptSchema,
        });
        const prompt = result.prompt.trim();
        return prompt.length > 0 ? prompt : fallbackPrompt(input);
      } catch {
        return fallbackPrompt(input);
      }
    },
    async submit({ prompt }) {
      if (adapter == null) {
        throw new Error("FAL_KEY is not configured.");
      }
      const job = await generateVideo({ adapter, prompt });
      return { jobId: job.jobId };
    },
    async status({ jobId }) {
      if (adapter == null) {
        throw new Error("FAL_KEY is not configured.");
      }
      const result = await getVideoJobStatus({ adapter, jobId });
      return {
        status: result.status,
        progress: result.progress ?? null,
        url: result.url ?? null,
        error: result.error ?? null,
      };
    },
  };
}
