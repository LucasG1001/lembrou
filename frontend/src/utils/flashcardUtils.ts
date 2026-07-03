import type { FlashcardSummary } from "../types/flashcard";

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
