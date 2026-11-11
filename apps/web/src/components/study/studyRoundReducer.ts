import type { SessionStats } from "./SessionSummary";

export type AnswerResult = "KNOWN" | "STILL_LEARNING" | "CORRECT" | "INCORRECT";

interface AnswerRecord {
  id: string;
  result: AnswerResult;
  save: "pending" | "saved" | "failed";
}

/**
 * - answering: the current deck is on screen; `index` is the card being asked.
 * - loading-next-round: waiting for in-flight answers to save and for a fresh deck. The old
 *   deck must not be shown again, or its cards could be answered twice.
 */
export interface StudyRoundState {
  phase: "answering" | "loading-next-round";
  round: number;
  index: number;
  answers: ReadonlyArray<AnswerRecord>;
}

export type StudyRoundAction =
  | { type: "answered"; id: string; result: AnswerResult }
  | { type: "answerSaved"; id: string }
  | { type: "answerFailed"; id: string }
  | { type: "nextRoundRequested" }
  | { type: "nextRoundLoaded" };

export const INITIAL_STUDY_ROUND: StudyRoundState = {
  phase: "answering",
  round: 0,
  index: 0,
  answers: [],
};

function withSave(state: StudyRoundState, id: string, save: AnswerRecord["save"]): StudyRoundState {
  return {
    ...state,
    answers: state.answers.map((answer) => (answer.id === id ? { ...answer, save } : answer)),
  };
}

export function studyRoundReducer(
  state: StudyRoundState,
  action: StudyRoundAction,
): StudyRoundState {
  switch (action.type) {
    case "answered": {
      if (state.phase !== "answering") {
        return state;
      }
      return {
        ...state,
        index: state.index + 1,
        answers: [...state.answers, { id: action.id, result: action.result, save: "pending" }],
      };
    }
    case "answerSaved": {
      return withSave(state, action.id, "saved");
    }
    case "answerFailed": {
      return withSave(state, action.id, "failed");
    }
    case "nextRoundRequested": {
      return state.phase === "answering" ? { ...state, phase: "loading-next-round" } : state;
    }
    case "nextRoundLoaded": {
      if (state.phase !== "loading-next-round") {
        return state;
      }
      return { phase: "answering", round: state.round + 1, index: 0, answers: [] };
    }
  }
}

/** Session totals from answers that were not lost; a failed save is not counted as progress. */
export function sessionStatsFor(answers: ReadonlyArray<AnswerRecord>): SessionStats {
  const stats: SessionStats = { answered: 0, known: 0, correct: 0, incorrect: 0, stillLearning: 0 };
  for (const answer of answers) {
    if (answer.save === "failed") {
      continue;
    }
    stats.answered += 1;
    switch (answer.result) {
      case "KNOWN": {
        stats.known += 1;
        // oxlint-disable-next-line eslint-unicorn/no-break-in-nested-loop -- exits only the switch; retain one result count per answer
        break;
      }
      case "CORRECT": {
        stats.correct += 1;
        // oxlint-disable-next-line eslint-unicorn/no-break-in-nested-loop -- exits only the switch; retain one result count per answer
        break;
      }
      case "INCORRECT": {
        stats.incorrect += 1;
        // oxlint-disable-next-line eslint-unicorn/no-break-in-nested-loop -- exits only the switch; retain one result count per answer
        break;
      }
      case "STILL_LEARNING": {
        stats.stillLearning += 1;
        // oxlint-disable-next-line eslint-unicorn/no-break-in-nested-loop -- exits only the switch; retain one result count per answer
        break;
      }
    }
  }
  return stats;
}
