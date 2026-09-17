import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { toExamples } from "../vocabulary/examples";

const NEEDS_QUOTES = /["\n\r,]/;
/** Lets spreadsheets detect UTF-8 so Hebrew and accented text open correctly. */
const BYTE_ORDER_MARK = String.fromCodePoint(0xfe_ff);

function csvField(value: string): string {
  return NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export const exportRouter = {
  /** CSV of a book's vocabulary, highest priority first. Includes a UTF-8 BOM for spreadsheets. */
  csv: protectedProcedure
    .input(z.object({ bookId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const book = await context.db.book.findFirst({
        where: { id: input.bookId, userId },
        select: { id: true, title: true },
      });
      if (book == null) {
        throw new ORPCError("NOT_FOUND", { message: "Book not found" });
      }
      const cards = await context.db.vocabCard.findMany({
        where: { bookId: book.id, userId },
        include: { reviewState: true },
        orderBy: { priorityScore: "desc" },
      });
      const rows: Array<Array<string>> = [
        [
          "Word",
          "Lemma",
          "Translation",
          "Part of speech",
          "Type",
          "Explanation",
          "Example",
          "Example translation",
          "Frequency",
          "Status",
        ],
      ];
      for (const card of cards) {
        const example = toExamples(card.examples)[0];
        rows.push([
          card.displayForm,
          card.lemma ?? "",
          card.translation,
          card.partOfSpeech ?? "",
          card.phraseType ?? (card.isPhrase ? "PHRASE" : "WORD"),
          card.explanation,
          example?.source ?? "",
          example?.translation ?? "",
          String(card.bookFrequency),
          card.reviewState?.status ?? "NEW",
        ]);
      }
      const csv = `${BYTE_ORDER_MARK}${rows.map((row) => row.map((field) => csvField(field)).join(",")).join("\r\n")}`;
      return { csv, title: book.title };
    }),
};
