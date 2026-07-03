import type { Flashcard, FlashcardSummary, Grade } from "../types/flashcard";

export function isDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt).getTime() <= Date.now();
}

export function countDue(cards: FlashcardSummary[]): number {
  return cards.filter((c) => isDue(c.nextReviewAt)).length;
}

export function formatNextReview(nextReviewAt: string): { label: string; overdue: boolean } {
  const now = new Date();
  const due = new Date(nextReviewAt);
  if (due.getTime() <= now.getTime()) return { label: "vencido", overdue: true };

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const days = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);

  if (days <= 0) return { label: "hoje", overdue: false };
  if (days === 1) return { label: "amanhã", overdue: false };
  return { label: `em ${days} dias`, overdue: false };
}

export function previewIntervals(card: Flashcard): Record<Grade, string> {
  const { intervalDays: i, repetitions: reps, easeFactor: ef } = card;

  const hard = reps === 0 ? 1 : Math.max(i + 1, Math.round(i * 1.2));
  const good = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(i * ef);
  const easy = reps === 0 ? 4 : Math.max(i + 1, Math.round(i * ef * 1.3));

  return {
    again: "<10min",
    hard: `${hard}d`,
    good: `${good}d`,
    easy: `${easy}d`,
  };
}
