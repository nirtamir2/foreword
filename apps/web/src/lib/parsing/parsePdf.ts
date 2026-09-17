import * as pdfjs from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import { countWords, normalizeWhitespace } from "./textUtils";
import { PDF_PAGES_PER_CHAPTER } from "./types";
import type { ParsedBookContent, ParsedChapter } from "./types";

/** pdf.js decodes in its own worker; wire the bundled worker through Vite on first use. */
function ensureWorker(): void {
  pdfjs.GlobalWorkerOptions.workerPort ??= new PdfWorker();
}

export class PdfParseError extends Error {
  readonly reason: "no-text";

  constructor(reason: PdfParseError["reason"]) {
    super(`PDF parse failed: ${reason}`);
    this.reason = reason;
  }
}

interface PdfInfo {
  Title?: unknown;
  Author?: unknown;
  Language?: unknown;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface Props {
  data: ArrayBuffer;
  onPage?: (input: { page: number; total: number }) => void;
}

/** Parse a text-based PDF into pseudo-chapters of consecutive pages. */
export async function parsePdf({ data, onPage }: Props): Promise<ParsedBookContent> {
  ensureWorker();
  const pdf = await pdfjs.getDocument({ data }).promise;

  const pageTexts: Array<string> = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let pageText = "";
    for (const item of content.items) {
      if ("str" in item) {
        pageText += item.str;
        pageText += item.hasEOL ? "\n" : " ";
      }
    }
    pageTexts.push(pageText);
    page.cleanup();
    onPage?.({ page: pageNumber, total: pdf.numPages });
  }

  const chapters: Array<ParsedChapter> = [];
  for (let start = 0; start < pageTexts.length; start += PDF_PAGES_PER_CHAPTER) {
    const end = Math.min(start + PDF_PAGES_PER_CHAPTER, pageTexts.length);
    const text = normalizeWhitespace(pageTexts.slice(start, end).join("\n\n"));
    if (text.length === 0) {
      continue;
    }
    chapters.push({
      index: chapters.length,
      title: null,
      text,
      wordCount: countWords(text),
      pageRange: { start: start + 1, end },
    });
  }

  if (chapters.length === 0) {
    throw new PdfParseError("no-text");
  }

  const metadata = await pdf.getMetadata().catch(() => null);
  const info = (metadata?.info ?? null) as PdfInfo | null;

  return {
    title: asTrimmedString(info?.Title),
    author: asTrimmedString(info?.Author),
    declaredLanguage: asTrimmedString(info?.Language)?.toLowerCase().split("-")[0] ?? null,
    chapters,
    totalWords: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0),
    totalPages: pdf.numPages,
  };
}
