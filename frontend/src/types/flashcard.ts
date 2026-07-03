export type Grade = "again" | "hard" | "good" | "easy";

export interface FlashcardSummary {
  id: string;
  question: string;
  answer: string;
  tag: string | null;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard extends FlashcardSummary {
  questionImages: string[];
  answerImages: string[];
}

export interface FlashcardFormData {
  question: string;
  answer: string;
  questionImages: string[];
  answerImages: string[];
  tag: string | null;
}
