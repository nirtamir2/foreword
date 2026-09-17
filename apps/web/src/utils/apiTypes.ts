import type { AppRouterClient } from "@app-template/api/routers/index";

type Output<T extends (...args: Array<never>) => Promise<unknown>> = Awaited<ReturnType<T>>;

export type BookListItem = Output<AppRouterClient["books"]["list"]>[number];
export type BookDetail = Output<AppRouterClient["books"]["get"]>;
export type VocabularyCardRow = Output<AppRouterClient["cards"]["list"]>[number];
export type StudySessionData = Output<AppRouterClient["study"]["session"]>;
export type StudyCard = StudySessionData["cards"][number];
export type CardVideoState = Output<AppRouterClient["media"]["cardVideo"]>;
