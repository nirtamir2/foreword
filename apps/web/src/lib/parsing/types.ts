export type SourceFormat = "EPUB" | "PDF";

/** PDFs have no chapter structure, so pages are folded into pseudo-chapters of this size. */
export const PDF_PAGES_PER_CHAPTER = 10;

export interface ParsedChapter {
  index: number;
  title: string | null;
  text: string;
  wordCount: number;
  /** For PDFs: the first and last page number folded into this pseudo-chapter. */
  pageRange: { start: number; end: number } | null;
}

export interface ParsedBookContent {
  title: string | null;
  author: string | null;
  /** Language declared by the file, or null when the file has no metadata. */
  declaredLanguage: string | null;
  chapters: Array<ParsedChapter>;
  totalWords: number;
  totalPages: number | null;
}

export interface ParsedBook extends ParsedBookContent {
  sourceFormat: SourceFormat;
  /** SHA-256 of the file bytes. Identifies the book on the server without storing it. */
  contentHash: string;
  /** Best-effort language code after combining metadata and text detection. */
  detectedLanguage: string | null;
  fileName: string;
  fileSize: number;
}
