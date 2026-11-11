import { describe, expect, it } from "vitest";
import { INITIAL_STUDY_ROUND, sessionStatsFor, studyRoundReducer } from "./studyRoundReducer";
import type { StudyRoundAction, StudyRoundState } from "./studyRoundReducer";

function apply(actions: ReadonlyArray<StudyRoundAction>): StudyRoundState {
  let state = INITIAL_STUDY_ROUND;
  for (const action of actions) {
    state = studyRoundReducer(state, action);
  }
  return state;
}

describe("studyRoundReducer", () => {
  it("advances one card per answer and tracks the save as pending", () => {
    const state = apply([{ type: "answered", id: "a1", result: "CORRECT" }]);
    expect(state.index).toBe(1);
    expect(state.answers).toEqual([{ id: "a1", result: "CORRECT", save: "pending" }]);
  });

  it("ignores answers while the next round is loading, so the old deck cannot be re-answered", () => {
    const loading = apply([
      { type: "answered", id: "a1", result: "KNOWN" },
      { type: "nextRoundRequested" },
    ]);
    expect(loading.phase).toBe("loading-next-round");
    expect(loading.index).toBe(1);
    expect(studyRoundReducer(loading, { type: "answered", id: "a2", result: "KNOWN" })).toBe(
      loading,
    );
  });

  it("resets index and answers only once the fresh deck has loaded", () => {
    const state = apply([
      { type: "answered", id: "a1", result: "KNOWN" },
      { type: "nextRoundRequested" },
      { type: "nextRoundLoaded" },
    ]);
    expect(state).toEqual({ phase: "answering", round: 1, index: 0, answers: [] });
  });

  it("ignores a stray nextRoundLoaded while answering", () => {
    const state = apply([{ type: "answered", id: "a1", result: "KNOWN" }]);
    expect(studyRoundReducer(state, { type: "nextRoundLoaded" })).toBe(state);
  });
});

describe("sessionStatsFor", () => {
  it("does not count answers whose save failed", () => {
    const state = apply([
      { type: "answered", id: "a1", result: "CORRECT" },
      { type: "answered", id: "a2", result: "INCORRECT" },
      { type: "answered", id: "a3", result: "KNOWN" },
      { type: "answerSaved", id: "a1" },
      { type: "answerFailed", id: "a2" },
    ]);
    expect(sessionStatsFor(state.answers)).toEqual({
      answered: 2,
      known: 1,
      correct: 1,
      incorrect: 0,
      stillLearning: 0,
    });
  });
});
