import { auth } from "@app-template/auth";
import db from "@app-template/db";
import type { Db } from "@app-template/db";
import { env } from "@app-template/env/server";
import { createVideoService } from "./media/videoService";
import type { VideoService } from "./media/videoService";
import type { RefineInput, RefinedItem } from "./vocabulary/refinementSchema";
import { refineVocabulary } from "./vocabulary/refineVocabulary";

async function refineWithConfiguredModel(input: RefineInput): Promise<Array<RefinedItem>> {
  return await refineVocabulary({ apiKey: env.AI_API_KEY ?? null, model: env.AI_MODEL, input });
}

export interface Context {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  db: Db;
  ai: {
    model: string;
    isConfigured: boolean;
    refineVocabulary: typeof refineWithConfiguredModel;
  };
  video: VideoService;
}

const videoService = createVideoService({
  apiKey: env.FAL_KEY ?? null,
  model: env.FAL_VIDEO_MODEL,
  promptApiKey: env.AI_API_KEY ?? null,
  promptModel: env.AI_MODEL,
});

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    session,
    db,
    ai: {
      model: env.AI_MODEL,
      isConfigured: env.AI_API_KEY != null,
      refineVocabulary: refineWithConfiguredModel,
    },
    video: videoService,
  };
}
