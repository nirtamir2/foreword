type AnalysisStatus = "PENDING" | "ANALYZING" | "READY";

export type PreparationState = "preparing" | "resumable" | "needs-file" | "ready" | "empty";

interface Props {
  analysisStatus: AnalysisStatus;
  cardCount: number;
  pendingCandidates: number;
  isPreparing: boolean;
}

/**
 * Where a book stands in the preparation pipeline.
 * - preparing: a run is active in this tab.
 * - resumable: candidates are saved; refinement can continue without the file.
 * - needs-file: the pipeline stopped before candidates were saved; the file is required.
 * - ready: preparation finished and cards exist.
 * - empty: preparation finished but produced no cards.
 */
export function preparationState({
  analysisStatus,
  cardCount,
  pendingCandidates,
  isPreparing,
}: Props): PreparationState {
  if (isPreparing) {
    return "preparing";
  }
  if (analysisStatus === "READY") {
    if (cardCount > 0) {
      return "ready";
    }
    return pendingCandidates > 0 ? "resumable" : "empty";
  }
  if (pendingCandidates > 0) {
    return "resumable";
  }
  return cardCount > 0 ? "ready" : "needs-file";
}
