import { spDateAtTime } from "../lib/dateUtils.js";

export const MAX_BOX = 5;
const DAY_START_HOUR = 4;

// Sistema de Leitner: cada caixa tem um intervalo em dias (índice = caixa − 1).
export const BOX_INTERVALS_DAYS = [1, 2, 4, 7, 15];

export interface ReviewOutcome {
  box: number;
  nextReviewAt: Date;
}

export function clampBox(box: number): number {
  if (!Number.isFinite(box) || box < 1) return 1;
  if (box > MAX_BOX) return MAX_BOX;
  return Math.floor(box);
}

export function review(box: number, correct: boolean, now: Date): ReviewOutcome {
  const current = clampBox(box);
  const nextBox = correct ? Math.min(current + 1, MAX_BOX) : 1;
  const intervalDays = BOX_INTERVALS_DAYS[nextBox - 1]!;
  return {
    box: nextBox,
    nextReviewAt: spDateAtTime(now, intervalDays, DAY_START_HOUR, 0),
  };
}
