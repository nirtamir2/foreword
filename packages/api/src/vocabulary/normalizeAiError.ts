export type AiErrorCode =
  | "TOO_MANY_REQUESTS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "PAYLOAD_TOO_LARGE"
  | "BAD_GATEWAY"
  | "SERVICE_UNAVAILABLE";

export interface NormalizedAiError {
  code: AiErrorCode;
  message: string;
  providerStatus: number | null;
  providerMessage: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value != null ? (value as Record<string, unknown>) : null;
}

function collectText({ value, depth = 0 }: { value: unknown; depth?: number }): Array<string> {
  if (depth > 3 || value == null) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  const record = asRecord(value);
  if (record == null) {
    return [];
  }
  const text: Array<string> = [];
  for (const field of ["name", "message", "status", "code", "details"] as const) {
    const property = record[field];
    if (typeof property === "string" || typeof property === "number") {
      text.push(String(property));
    }
  }
  return [
    ...text,
    ...collectText({ value: record.error, depth: depth + 1 }),
    ...collectText({ value: record.cause, depth: depth + 1 }),
  ];
}

const STATUS_PATTERN = /\b(400|401|403|408|413|429|500|502|503|504)\b/;

function findStatus(value: unknown): number | null {
  const record = asRecord(value);
  const direct = record?.status;
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return direct;
  }
  if (record?.cause != null) {
    const nested = findStatus(record.cause);
    if (nested != null) {
      return nested;
    }
  }
  const match = STATUS_PATTERN.exec(collectText({ value }).join(" "));
  return match?.[1] == null ? null : Number(match[1]);
}

/** Map an arbitrary provider failure onto an oRPC error code and a readable message. */
export function normalizeAiError(error: unknown): NormalizedAiError {
  const status = findStatus(error);
  const text = collectText({ value: error }).join(" ");
  const lower = text.toLowerCase();
  const providerMessage =
    (asRecord(error)?.message as string | undefined) ??
    (text.length > 0 ? text : "Unknown AI error");
  const suffix = status == null ? "" : ` (HTTP ${String(status)})`;

  if (
    status === 429 ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("quota")
  ) {
    return {
      code: "TOO_MANY_REQUESTS",
      message: `AI rate limit or quota exceeded${suffix}: ${providerMessage}`,
      providerStatus: status,
      providerMessage,
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api key") ||
    lower.includes("unauthenticated") ||
    lower.includes("permission_denied")
  ) {
    return {
      code: status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
      message: `AI authentication failed${suffix}: ${providerMessage}`,
      providerStatus: status,
      providerMessage,
    };
  }
  if (status === 413 || lower.includes("payload too large") || lower.includes("maximum context")) {
    return {
      code: "PAYLOAD_TOO_LARGE",
      message: `AI request was too large${suffix}: ${providerMessage}`,
      providerStatus: status,
      providerMessage,
    };
  }
  if (lower.includes("unsupported gemini model")) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: `AI model is not configured correctly: ${providerMessage}`,
      providerStatus: status,
      providerMessage,
    };
  }
  if (status === 503) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: `AI provider is temporarily unavailable${suffix}: ${providerMessage}`,
      providerStatus: status,
      providerMessage,
    };
  }
  return {
    code: "BAD_GATEWAY",
    message: `AI provider failed${suffix}: ${providerMessage}`,
    providerStatus: status,
    providerMessage,
  };
}

/** Errors where retrying the same request immediately will not help. */
export function isTerminalAiError(error: unknown): boolean {
  const { code } = normalizeAiError(error);
  return code === "TOO_MANY_REQUESTS" || code === "UNAUTHORIZED" || code === "FORBIDDEN";
}

/** Errors that affect the whole provider rather than one oversized batch. */
export function isProviderWideAiError(error: unknown): boolean {
  return isTerminalAiError(error) || normalizeAiError(error).code === "SERVICE_UNAVAILABLE";
}
