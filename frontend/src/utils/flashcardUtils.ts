import type { FlashcardSummary } from "../types/flashcard";

export function isDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt).getTime() <= Date.now();
}

export function countDue(cards: FlashcardSummary[]): number {
  return cards.filter((c) => isDue(c.nextReviewAt)).length;
}
