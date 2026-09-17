import { m } from "@/paraglide/messages.js";

export type LearnerLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ReviewStatus = "NEW" | "LEARNING" | "KNOWN";
export type AnalysisStatus = "PENDING" | "ANALYZING" | "READY";
export type PhraseType = "WORD" | "COLLOCATION" | "PHRASAL_VERB" | "IDIOM" | "PROPER_NOUN";

export const LEVELS: ReadonlyArray<LearnerLevel> = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export function levelLabel({ level }: { level: LearnerLevel }): string {
  switch (level) {
    case "BEGINNER": {
      return m.level_beginner();
    }
    case "INTERMEDIATE": {
      return m.level_intermediate();
    }
    case "ADVANCED": {
      return m.level_advanced();
    }
  }
}

export function levelDescription({ level }: { level: LearnerLevel }): string {
  switch (level) {
    case "BEGINNER": {
      return m.level_beginner_description();
    }
    case "INTERMEDIATE": {
      return m.level_intermediate_description();
    }
    case "ADVANCED": {
      return m.level_advanced_description();
    }
  }
}

export function statusLabel({ status }: { status: ReviewStatus }): string {
  switch (status) {
    case "NEW": {
      return m.status_new();
    }
    case "LEARNING": {
      return m.status_learning();
    }
    case "KNOWN": {
      return m.status_known();
    }
  }
}

export function analysisStatusLabel({ status }: { status: AnalysisStatus }): string {
  switch (status) {
    case "PENDING": {
      return m.analysis_status_pending();
    }
    case "ANALYZING": {
      return m.analysis_status_analyzing();
    }
    case "READY": {
      return m.analysis_status_ready();
    }
  }
}

export function phraseTypeLabel({ phraseType }: { phraseType: string }): string {
  switch (phraseType) {
    case "WORD": {
      return m.phrase_type_word();
    }
    case "COLLOCATION": {
      return m.phrase_type_collocation();
    }
    case "PHRASAL_VERB": {
      return m.phrase_type_phrasal_verb();
    }
    case "IDIOM": {
      return m.phrase_type_idiom();
    }
    case "PROPER_NOUN": {
      return m.phrase_type_proper_noun();
    }
    default: {
      return phraseType
        .toLowerCase()
        .split("_")
        .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
}

export function difficultyLabel({ difficulty }: { difficulty: number }): string {
  if (difficulty < 0.34) {
    return m.difficulty_easy();
  }
  if (difficulty < 0.67) {
    return m.difficulty_medium();
  }
  return m.difficulty_hard();
}

export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelativeDate(date: Date, locale: string): string {
  const diffMs = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) {
    return formatter.format(days, "day");
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
