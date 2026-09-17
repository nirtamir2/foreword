import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { assertBookOwnership, protectedProcedure } from "../index";

export const levelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const sourceFormatSchema = z.enum(["EPUB", "PDF"]);
export const positionTypeSchema = z.enum(["START", "CHAPTER", "PAGE", "PERCENT"]);

const languageSchema = z.string().min(2).max(12);

const createBookSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(300).nullable(),
  bookLanguage: languageSchema,
  nativeLanguage: languageSchema,
  level: levelSchema,
  sourceFormat: sourceFormatSchema,
  contentHash: z.string().regex(/^[a-f\d]{64}$/),
  totalChapters: z.number().int().nonnegative().nullable(),
  totalWords: z.number().int().nonnegative().nullable(),
  positionType: positionTypeSchema,
  positionValue: z.number().int().nonnegative().nullable(),
});

const updateBookSchema = z.object({
  bookId: z.string().min(1),
  title: z.string().min(1).max(300).optional(),
  author: z.string().max(300).nullable().optional(),
  level: levelSchema.optional(),
  nativeLanguage: languageSchema.optional(),
  positionType: positionTypeSchema.optional(),
  positionValue: z.number().int().nonnegative().nullable().optional(),
});

const bookIdSchema = z.object({ bookId: z.string().min(1) });

export const booksRouter = {
  /** Create a book from browser-parsed metadata. Re-uploading the same file reuses the book. */
  create: protectedProcedure.input(createBookSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const existing = await context.db.book.findUnique({
      where: { userId_contentHash: { userId, contentHash: input.contentHash } },
      select: { id: true },
    });
    const profile = {
      title: input.title,
      author: input.author,
      bookLanguage: input.bookLanguage,
      nativeLanguage: input.nativeLanguage,
      level: input.level,
      sourceFormat: input.sourceFormat,
      totalChapters: input.totalChapters,
      totalWords: input.totalWords,
      positionType: input.positionType,
      positionValue: input.positionValue,
    };
    if (existing != null) {
      await context.db.book.update({ where: { id: existing.id }, data: profile });
      return { id: existing.id, reused: true };
    }
    const created = await context.db.book.create({
      data: { ...profile, userId, contentHash: input.contentHash },
      select: { id: true },
    });
    return { id: created.id, reused: false };
  }),

  /** Books of the signed-in user with learning progress. */
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const books = await context.db.book.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { cards: true } } },
    });

    const knownByBook = new Map<string, number>();
    const learningByBook = new Map<string, number>();
    const perBook = await context.db.vocabCard.findMany({
      where: { userId, reviewState: { status: { in: ["KNOWN", "LEARNING"] } } },
      select: { bookId: true, reviewState: { select: { status: true } } },
    });
    for (const card of perBook) {
      const target = card.reviewState?.status === "KNOWN" ? knownByBook : learningByBook;
      target.set(card.bookId, (target.get(card.bookId) ?? 0) + 1);
    }

    return books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      bookLanguage: book.bookLanguage,
      nativeLanguage: book.nativeLanguage,
      level: book.level,
      sourceFormat: book.sourceFormat,
      totalChapters: book.totalChapters,
      totalWords: book.totalWords,
      analysisStatus: book.analysisStatus,
      updatedAt: book.updatedAt,
      createdAt: book.createdAt,
      cardCount: book._count.cards,
      knownCount: knownByBook.get(book.id) ?? 0,
      learningCount: learningByBook.get(book.id) ?? 0,
    }));
  }),

  get: protectedProcedure.input(bookIdSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const book = await context.db.book.findFirst({
      where: { id: input.bookId, userId },
      include: { _count: { select: { cards: true } } },
    });
    if (book == null) {
      throw new ORPCError("NOT_FOUND", { message: "Book not found" });
    }
    const [pendingCandidates, totalCandidates, knownCount, learningCount] = await Promise.all([
      context.db.vocabularyCandidate.count({
        where: { bookId: book.id, userId, status: "PENDING" },
      }),
      context.db.vocabularyCandidate.count({ where: { bookId: book.id, userId } }),
      context.db.vocabCard.count({
        where: { bookId: book.id, userId, reviewState: { status: "KNOWN" } },
      }),
      context.db.vocabCard.count({
        where: { bookId: book.id, userId, reviewState: { status: "LEARNING" } },
      }),
    ]);
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      bookLanguage: book.bookLanguage,
      nativeLanguage: book.nativeLanguage,
      level: book.level,
      sourceFormat: book.sourceFormat,
      contentHash: book.contentHash,
      totalChapters: book.totalChapters,
      totalWords: book.totalWords,
      positionType: book.positionType,
      positionValue: book.positionValue,
      analysisStatus: book.analysisStatus,
      cardCount: book._count.cards,
      knownCount,
      learningCount,
      pendingCandidates,
      totalCandidates,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }),

  update: protectedProcedure.input(updateBookSchema).handler(async ({ input, context }) => {
    const { bookId, ...changes } = input;
    const result = await context.db.book.updateMany({
      where: { id: bookId, userId: context.session.user.id },
      data: changes,
    });
    if (result.count === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Book not found" });
    }
    return { success: true };
  }),

  delete: protectedProcedure.input(bookIdSchema).handler(async ({ input, context }) => {
    await assertBookOwnership({
      db: context.db,
      bookId: input.bookId,
      userId: context.session.user.id,
    });
    await context.db.book.deleteMany({
      where: { id: input.bookId, userId: context.session.user.id },
    });
    return { success: true };
  }),
};
