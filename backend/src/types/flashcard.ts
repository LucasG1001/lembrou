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

export interface FlashcardRow {
  id: string;
  question: string;
  answer: string;
  question_images: string[];
  answer_images: string[];
  tag: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FlashcardSummaryRow = Omit<FlashcardRow, "question_images" | "answer_images">;

export interface NewFlashcard {
  question: string;
  answer: string;
  questionImages: string[];
  answerImages: string[];
  tag: string | null;
}

export interface FlashcardPatch {
  question?: string;
  answer?: string;
  questionImages?: string[];
  answerImages?: string[];
  tag?: string | null;
}
