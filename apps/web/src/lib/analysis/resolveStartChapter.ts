import { PDF_PAGES_PER_CHAPTER } from "@/lib/parsing/types";

export type PositionType = "START" | "CHAPTER" | "PAGE" | "PERCENT";

interface Props {
  positionType: PositionType;
  positionValue: number | null;
  totalChapters: number;
}

function clampIndex(value: number, lastIndex: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(Math.round(value), lastIndex);
}

/** Map the reader's stated position onto a 0-based chapter index used for earliness scoring. */
export function resolveStartChapter({ positionType, positionValue, totalChapters }: Props): number {
  const lastIndex = Math.max(0, totalChapters - 1);
  const value = positionValue ?? 0;
  switch (positionType) {
    case "START": {
      return 0;
    }
    case "CHAPTER": {
      return clampIndex(value - 1, lastIndex);
    }
    case "PAGE": {
      return clampIndex(Math.floor((value - 1) / PDF_PAGES_PER_CHAPTER), lastIndex);
    }
    case "PERCENT": {
      return clampIndex((value / 100) * lastIndex, lastIndex);
    }
  }
}
