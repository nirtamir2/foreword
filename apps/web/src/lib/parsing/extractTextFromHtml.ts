import { Parser } from "htmlparser2";
import { normalizeWhitespace } from "./textUtils";

const SKIP_TAGS = new Set(["script", "style", "head", "title", "nav", "svg", "math"]);
const BLOCK_TAGS = new Set([
  "p",
  "div",
  "br",
  "li",
  "ul",
  "ol",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "section",
  "article",
  "blockquote",
  "td",
  "tr",
  "table",
  "figure",
  "figcaption",
  "hr",
  "pre",
  "dd",
  "dt",
  "aside",
]);
const HEADING_TAGS = new Set(["h1", "h2", "h3"]);

export interface ExtractedHtml {
  text: string;
  /** First heading in the document, used as a chapter title when the EPUB has no TOC titles. */
  heading: string | null;
}

/**
 * Readable text from an (X)HTML string without a DOM, so it runs inside a Web Worker.
 * Block-level tags become line breaks; scripts, styles and navigation are dropped.
 */
export function extractTextFromHtml(html: string): ExtractedHtml {
  let text = "";
  let heading = "";
  let skipDepth = 0;
  let headingDepth = 0;
  let isHeadingCaptured = false;

  const parser = new Parser(
    {
      onopentag(name) {
        if (SKIP_TAGS.has(name)) {
          skipDepth += 1;
        } else if (!isHeadingCaptured && HEADING_TAGS.has(name)) {
          headingDepth += 1;
        }
      },
      ontext(data) {
        if (skipDepth > 0) {
          return;
        }
        text += data;
        if (headingDepth > 0) {
          heading += data;
        }
      },
      onclosetag(name) {
        if (SKIP_TAGS.has(name)) {
          skipDepth = Math.max(0, skipDepth - 1);
          return;
        }
        if (HEADING_TAGS.has(name) && headingDepth > 0) {
          headingDepth -= 1;
          if (headingDepth === 0 && heading.trim().length > 0) {
            isHeadingCaptured = true;
          }
        }
        if (BLOCK_TAGS.has(name)) {
          text += "\n";
        }
      },
    },
    { decodeEntities: true },
  );
  parser.write(html);
  parser.end();

  const cleanHeading = normalizeWhitespace(heading).replaceAll("\n", " ");
  return {
    text: normalizeWhitespace(text),
    heading: cleanHeading.length > 0 && cleanHeading.length <= 120 ? cleanHeading : null,
  };
}
