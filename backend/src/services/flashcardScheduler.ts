import { addMinutes, spDateAtTime } from "../lib/dateUtils.js";

export type Grade = "again" | "hard" | "good" | "easy";

export interface SchedulerState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface ReviewOutcome extends SchedulerState {
  nextReviewAt: Date;
}

const MIN_EASE = 1.3;
const RELEARN_MINUTES = 10;
const DAY_START_HOUR = 4;

export const INITIAL_STATE: SchedulerState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
};

function dueAt(now: Date, intervalDays: number): Date {
  return spDateAtTime(now, intervalDays, DAY_START_HOUR, 0);
}

export function review(state: SchedulerState, grade: Grade, now: Date): ReviewOutcome {
  if (grade === "again") {
    return {
      easeFactor: Math.max(MIN_EASE, state.easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
      nextReviewAt: addMinutes(now, RELEARN_MINUTES),
    };
  }

  let easeFactor = state.easeFactor;
  let intervalDays: number;

  if (grade === "hard") {
    easeFactor = Math.max(MIN_EASE, state.easeFactor - 0.15);
    intervalDays =
      state.repetitions === 0
        ? 1
        : Math.max(state.intervalDays + 1, Math.round(state.intervalDays * 1.2));
  } else if (grade === "good") {
    if (state.repetitions === 0) {
      intervalDays = 1;
    } else if (state.repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(state.intervalDays * state.easeFactor);
    }
  } else {
    easeFactor = state.easeFactor + 0.15;
    intervalDays =
      state.repetitions === 0
        ? 4
        : Math.max(state.intervalDays + 1, Math.round(state.intervalDays * state.easeFactor * 1.3));
  }

  return {
    easeFactor,
    intervalDays,
    repetitions: state.repetitions + 1,
    lapses: state.lapses,
    nextReviewAt: dueAt(now, intervalDays),
  };
}
