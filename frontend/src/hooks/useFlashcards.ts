import { useEffect, useMemo, useState } from "react";
import type { Flashcard, FlashcardFormData, FlashcardSummary, Grade } from "../types/flashcard";
import {
  fetchFlashcards,
  createFlashcard as apiCreateFlashcard,
  updateFlashcard as apiUpdateFlashcard,
  deleteFlashcard as apiDeleteFlashcard,
  reviewFlashcard as apiReviewFlashcard,
} from "../services/flashcardService";
import { countDue } from "../utils/flashcardUtils";

interface UseFlashcardsReturn {
  cards: FlashcardSummary[];
  loading: boolean;
  error: string | null;
  dueCount: number;
  createCard: (data: FlashcardFormData) => Promise<void>;
  updateCard: (id: string, data: FlashcardFormData) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  applyReview: (id: string, grade: Grade) => Promise<Flashcard>;
}

export function useFlashcards(): UseFlashcardsReturn {
  const [cards, setCards] = useState<FlashcardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashcards()
      .then(setCards)
      .catch(() => setError("Não foi possível carregar os flashcards."))
      .finally(() => setLoading(false));
  }, []);

  const dueCount = useMemo(() => countDue(cards), [cards]);

  async function createCard(data: FlashcardFormData): Promise<void> {
    const created = await apiCreateFlashcard(data);
    setCards((prev) => [...prev, created]);
  }

  async function updateCard(id: string, data: FlashcardFormData): Promise<void> {
    const updated = await apiUpdateFlashcard(id, data);
    setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function deleteCard(id: string): Promise<void> {
    await apiDeleteFlashcard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function applyReview(id: string, grade: Grade): Promise<Flashcard> {
    const updated = await apiReviewFlashcard(id, grade);
    setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  return { cards, loading, error, dueCount, createCard, updateCard, deleteCard, applyReview };
}
