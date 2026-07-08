export interface FlashcardSummary {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  box: number;
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
  categoryId: string | null;
}
