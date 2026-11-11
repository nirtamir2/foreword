type AnalysisStatus = "PENDING" | "ANALYZING" | "READY";

/**
 * Book status after a preparation run asks to finalize. READY needs cards or an empty backlog;
 * otherwise the book stays resumable. READY never regresses.
 */
export function nextAnalysisStatus({
  current,
  cardCount,
  pendingCount,
}: {
  current: AnalysisStatus;
  cardCount: number;
  pendingCount: number;
}): AnalysisStatus {
  if (current === "READY" || cardCount > 0 || pendingCount === 0) {
    return "READY";
  }
  return current;
}
