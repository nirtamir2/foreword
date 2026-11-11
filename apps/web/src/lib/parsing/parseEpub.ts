import { Parser } from "htmlparser2";
import JSZip from "jszip";
import { extractTextFromHtml } from "./extractTextFromHtml";
import { countWords } from "./textUtils";
import type { ParsedBookContent, ParsedChapter } from "./types";

interface ManifestItem {
  href: string;
  mediaType: string;
}

interface PackageDocument {
  title: string | null;
  author: string | null;
  language: string | null;
  manifest: Map<string, ManifestItem>;
  spine: Array<string>;
  ncxId: string | null;
}

export class EpubParseError extends Error {
  readonly reason: "missing-container" | "missing-rootfile" | "missing-package" | "no-text";

  constructor(reason: EpubParseError["reason"]) {
    super(`EPUB parse failed: ${reason}`);
    this.reason = reason;
  }
}

function attribute(attributes: Record<string, string>, name: string): string | null {
  return Object.hasOwn(attributes, name) ? (attributes[name] ?? null) : null;
}

function readRootfilePath(containerXml: string): string | null {
  let path: string | null = null;
  const parser = new Parser(
    {
      onopentag(name, attributes) {
        if (name.toLowerCase() === "rootfile") {
          path ??= attribute(attributes, "full-path");
        }
      },
    },
    { xmlMode: true },
  );
  parser.write(containerXml);
  parser.end();
  return path;
}

function cleanMetadata(value: string): string | null {
  const trimmed = value.replaceAll(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePackageDocument(opfXml: string): PackageDocument {
  const manifest = new Map<string, ManifestItem>();
  const spine: Array<string> = [];
  const meta = { title: "", author: "", language: "", ncxId: null as string | null };
  let capture: "title" | "author" | "language" | null = null;

  const parser = new Parser(
    {
      onopentag(name, attributes) {
        const tag = name.toLowerCase();
        switch (tag) {
          case "item": {
            const id = attribute(attributes, "id");
            const href = attribute(attributes, "href");
            if (id != null && href != null) {
              manifest.set(id, { href, mediaType: attribute(attributes, "media-type") ?? "" });
            }

            break;
          }
          case "itemref": {
            const idref = attribute(attributes, "idref");
            if (idref != null && attribute(attributes, "linear") !== "no") {
              spine.push(idref);
            }

            break;
          }
          case "spine": {
            meta.ncxId = attribute(attributes, "toc");

            break;
          }
          default: {
            if (tag === "dc:title" && meta.title.length === 0) {
              capture = "title";
            } else if (tag === "dc:creator" && meta.author.length === 0) {
              capture = "author";
            } else if (tag === "dc:language" && meta.language.length === 0) {
              capture = "language";
            }
          }
        }
      },
      ontext(data) {
        if (capture != null) {
          meta[capture] += data;
        }
      },
      onclosetag() {
        capture = null;
      },
    },
    { xmlMode: true },
  );
  parser.write(opfXml);
  parser.end();

  return {
    title: cleanMetadata(meta.title),
    author: cleanMetadata(meta.author),
    language: cleanMetadata(meta.language)?.toLowerCase().split("-", 1)[0] ?? null,
    manifest,
    spine,
    ncxId: meta.ncxId,
  };
}

/** Chapter titles from the EPUB 2 NCX table of contents, keyed by the target file path. */
function parseNcxTitles(ncxXml: string, ncxDir: string): Map<string, string> {
  const titles = new Map<string, string>();
  let pendingLabel = "";
  let isCapturingLabel = false;
  const parser = new Parser(
    {
      onopentag(name, attributes) {
        const tag = name.toLowerCase();
        switch (tag) {
          case "text": {
            isCapturingLabel = true;

            break;
          }
          case "content": {
            const src = attribute(attributes, "src");
            if (src != null && pendingLabel.trim().length > 0) {
              const path = resolvePath(ncxDir, src);
              if (!titles.has(path)) {
                titles.set(path, pendingLabel.trim());
              }
            }
            pendingLabel = "";

            break;
          }
          case "navpoint": {
            pendingLabel = "";

            break;
          }
          // No default
        }
      },
      ontext(data) {
        if (isCapturingLabel) {
          pendingLabel += data;
        }
      },
      onclosetag(name) {
        if (name.toLowerCase() === "text") {
          isCapturingLabel = false;
        }
      },
    },
    { xmlMode: true },
  );
  parser.write(ncxXml);
  parser.end();
  return titles;
}

/** Resolve an href relative to a directory inside the zip into a normalized path. */
function resolvePath(baseDir: string, href: string): string {
  const target = decodeURIComponent(href.split("#", 1)[0] ?? href);
  const segments = [...(baseDir.length > 0 ? baseDir.split("/") : []), ...target.split("/")];
  const stack: Array<string> = [];
  for (const segment of segments) {
    if (segment === "." || segment.length === 0) {
      continue;
    }
    if (segment === "..") {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }
  return stack.join("/");
}

function directoryOf(path: string): string {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

function isDocument(item: ManifestItem): boolean {
  if (item.mediaType.includes("html")) {
    return true;
  }
  const href = item.href.toLowerCase();
  return href.endsWith(".xhtml") || href.endsWith(".html") || href.endsWith(".htm");
}

/** Very short spine items are covers, title pages and copyright notices, not chapters. */
const MIN_CHAPTER_WORDS = 40;

/** Parse an EPUB into ordered chapters following the spine reading order. */
export async function parseEpub(data: ArrayBuffer): Promise<ParsedBookContent> {
  // The archive is a file the user picked from their own device and is parsed in the browser.
  // eslint-disable-next-line sonarjs/no-unsafe-unzip -- local, user-selected file
  const zip = await JSZip.loadAsync(data);

  const container = zip.file("META-INF/container.xml");
  if (container == null) {
    throw new EpubParseError("missing-container");
  }
  const opfPath = readRootfilePath(await container.async("string"));
  if (opfPath == null) {
    throw new EpubParseError("missing-rootfile");
  }
  const opfFile = zip.file(opfPath);
  if (opfFile == null) {
    throw new EpubParseError("missing-package");
  }

  const opfDir = directoryOf(opfPath);
  const pkg = parsePackageDocument(await opfFile.async("string"));

  let tocTitles = new Map<string, string>();
  const ncxItem = pkg.ncxId == null ? null : pkg.manifest.get(pkg.ncxId);
  if (ncxItem != null) {
    const ncxPath = resolvePath(opfDir, ncxItem.href);
    const ncxFile = zip.file(ncxPath);
    if (ncxFile != null) {
      tocTitles = parseNcxTitles(await ncxFile.async("string"), directoryOf(ncxPath));
    }
  }

  const chapters: Array<ParsedChapter> = [];
  for (const idref of pkg.spine) {
    const item = pkg.manifest.get(idref);
    if (item == null || !isDocument(item)) {
      continue;
    }
    const path = resolvePath(opfDir, item.href);
    const file = zip.file(path);
    if (file == null) {
      continue;
    }
    const extracted = extractTextFromHtml(await file.async("string"));
    const wordCount = countWords(extracted.text);
    if (wordCount < MIN_CHAPTER_WORDS) {
      continue;
    }
    chapters.push({
      index: chapters.length,
      title: tocTitles.get(path) ?? extracted.heading,
      text: extracted.text,
      wordCount,
      pageRange: null,
    });
  }

  if (chapters.length === 0) {
    throw new EpubParseError("no-text");
  }

  return {
    title: pkg.title,
    author: pkg.author,
    declaredLanguage: pkg.language,
    chapters,
    totalWords: chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0),
    totalPages: null,
  };
}
