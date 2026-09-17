/** Collapse runs of spaces and tabs, trim line ends, and cap blank lines at one. */
export function normalizeWhitespace(text: string): string {
  return text
    .replaceAll(/\r\n?/g, "\n")
    .replaceAll(/[^\S\n]+/g, " ")
    .replaceAll(/ ?\n ?/g, "\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
}

/** Whitespace-delimited word count. Accurate enough for progress and statistics. */
export function countWords(text: string): number {
  const matches = text.match(/\S+/gu);
  return matches == null ? 0 : matches.length;
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
