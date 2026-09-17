import { BookFileError } from "@/lib/parsing/parseBook";
import { m } from "@/paraglide/messages.js";

/** Turn parsing, upload and AI failures into a sentence the learner can act on. */
export function preparationErrorMessage({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}): string {
  if (error instanceof BookFileError) {
    switch (error.reason) {
      case "unsupported-type": {
        return m.error_unsupported_file();
      }
      case "too-large": {
        return m.error_file_too_large();
      }
      case "empty": {
        return m.error_file_empty();
      }
    }
  }
  if (error instanceof Error && error.name === "AbortError") {
    return m.error_preparation_cancelled();
  }
  if (!(error instanceof Error) || error.message.length === 0) {
    return fallback;
  }
  const text = error.message.toLowerCase();
  if (text.includes("epub parse failed")) {
    return m.error_invalid_epub();
  }
  if (text.includes("pdf parse failed") || text.includes("no-text")) {
    return m.error_pdf_no_text();
  }
  if (text.includes("invalid pdf") || text.includes("password")) {
    return m.error_invalid_pdf();
  }
  if (text.includes("rate limit") || text.includes("quota") || text.includes("too many requests")) {
    return m.error_ai_rate_limit();
  }
  if (
    text.includes("authentication failed") ||
    text.includes("api key") ||
    text.includes("unauthenticated")
  ) {
    return m.error_ai_auth();
  }
  if (text.includes("not configured correctly") || text.includes("unsupported gemini model")) {
    return m.error_ai_model();
  }
  if (text.includes("ai provider") || text.includes("unavailable")) {
    return m.error_ai_provider();
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return m.error_network();
  }
  return error.message;
}
