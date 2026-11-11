import * as Comlink from "comlink";
import { analyzeBook } from "@app-template/text-analysis";
import type { ChapterInput, LearnerLevel, VocabularyCandidate } from "@app-template/text-analysis";
import { loadFrequencyList } from "./frequencyList";
import { phraseLexiconFor } from "./phraseLexicon";

export interface AnalyzeBookRequest {
  chapters: Array<ChapterInput>;
  language: string;
  level: LearnerLevel;
  startChapterIndex: number;
  excluded: Array<string>;
  limit: number;
}

export interface AnalyzeBookResponse {
  candidates: Array<VocabularyCandidate>;
  frequencyListBundled: boolean;
}

const workerApi = {
  async analyze(request: AnalyzeBookRequest): Promise<AnalyzeBookResponse> {
    const language = request.language.split("-", 1)[0] ?? request.language;
    const frequency = await loadFrequencyList({ language });
    const candidates = analyzeBook({
      chapters: request.chapters,
      locale: request.language,
      level: request.level,
      startChapterIndex: request.startChapterIndex,
      frequency: {
        getRank: (word) => frequency.ranks.get(word) ?? null,
        maxRank: frequency.maxRank,
      },
      excluded: new Set(request.excluded),
      phraseLexicon: phraseLexiconFor({ language }),
      limit: request.limit,
    });
    return { candidates, frequencyListBundled: frequency.isBundled };
  },
};

export type AnalyzeWorkerApi = typeof workerApi;

Comlink.expose(workerApi);
