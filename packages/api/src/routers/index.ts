import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { analysisRouter } from "./analysis";
import { booksRouter } from "./books";
import { cardsRouter } from "./cards";
import { exportRouter } from "./export";
import { mediaRouter } from "./media";
import { studyRouter } from "./study";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session.user,
    };
  }),
  books: booksRouter,
  analysis: analysisRouter,
  cards: cardsRouter,
  study: studyRouter,
  export: exportRouter,
  media: mediaRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
