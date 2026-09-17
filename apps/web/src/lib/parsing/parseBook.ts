import { detectLanguage } from "./detectLanguage";
import { sha256Hex } from "./textUtils";
import type { ParsedBook, ParsedBookContent, ParsedChapter, SourceFormat } from "./types";

export const MAX_BOOK_FILE_BYTES = 60 * 1024 * 1024;
export const ACCEPTED_BOOK_TYPES = ".epub,.pdf,application/epub+zip,application/pdf";

export class BookFileError extends Error {
  readonly reason: "unsupported-type" | "too-large" | "empty";

  constructor(reason: BookFileError["reason"]) {
    super(`Book file rejected: ${reason}`);
    this.reason = reason;
  }
}

export function detectSourceFormat(file: File): SourceFormat | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".epub") || file.type === "application/epub+zip") {
    return "EPUB";
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return "PDF";
  }
  return null;
}

export function validateBookFile(file: File): SourceFormat {
  const format = detectSourceFormat(file);
  if (format == null) {
    throw new BookFileError("unsupported-type");
  }
  if (file.size === 0) {
    throw new BookFileError("empty");
  }
  if (file.size > MAX_BOOK_FILE_BYTES) {
    throw new BookFileError("too-large");
  }
  return format;
}

function detectFromChapters(chapters: ReadonlyArray<ParsedChapter>): string | null {
  const sample = chapters
    .slice(0, 4)
    .map((chapter) => chapter.text.slice(0, 4000))
    .join("\n");
  return detectLanguage(sample);
}

export interface ParseBookProgress {
  stage: "hashing" | "reading" | "detecting";
  /** 0-1 within the current stage when known. */
  ratio: number | null;
}

interface Props {
  file: File;
  onProgress?: (progress: ParseBookProgress) => void;
}

async function readContent({
  sourceFormat,
  buffer,
  onProgress,
}: {
  sourceFormat: SourceFormat;
  buffer: ArrayBuffer;
  onProgress: ((progress: ParseBookProgress) => void) | undefined;
}): Promise<ParsedBookContent> {
  if (sourceFormat === "EPUB") {
    const { parseEpub } = await import("./parseEpub");
    return await parseEpub(buffer);
  }
  const { parsePdf } = await import("./parsePdf");
  return await parsePdf({
    data: buffer,
    onPage: ({ page, total }) => {
      onProgress?.({ stage: "reading", ratio: page / total });
    },
  });
}

/**
 * Parse an uploaded book entirely in the browser. The bytes never leave the device: only
 * metadata, ranked candidates and short snippets are sent to the server afterwards.
 * Format parsers are imported lazily so pdf.js only loads when a PDF is opened.
 */
export async function parseBook({ file, onProgress }: Props): Promise<ParsedBook> {
  const sourceFormat = validateBookFile(file);
  const buffer = await file.arrayBuffer();
  onProgress?.({ stage: "hashing", ratio: null });
  const contentHash = await sha256Hex(buffer);

  onProgress?.({ stage: "reading", ratio: null });
  const content = await readContent({ sourceFormat, buffer, onProgress });

  onProgress?.({ stage: "detecting", ratio: null });
  const textLanguage = detectFromChapters(content.chapters);

  return {
    ...content,
    sourceFormat,
    contentHash,
    // Text detection wins over metadata: publishers frequently leave the wrong language in the file.
    detectedLanguage: textLanguage ?? content.declaredLanguage,
    fileName: file.name,
    fileSize: file.size,
  };
}
