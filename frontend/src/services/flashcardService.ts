import { api } from "./api";
import type { Flashcard, FlashcardFormData, FlashcardSummary, Grade } from "../types/flashcard";

export async function fetchFlashcards(): Promise<FlashcardSummary[]> {
  const response = await api.get<FlashcardSummary[]>("/api/flashcards");
  return response.data;
}

export async function fetchDueFlashcards(): Promise<Flashcard[]> {
  const response = await api.get<Flashcard[]>("/api/flashcards/due");
  return response.data;
}

export async function fetchFlashcard(id: string): Promise<Flashcard> {
  const response = await api.get<Flashcard>(`/api/flashcards/${id}`);
  return response.data;
}

export async function createFlashcard(data: FlashcardFormData): Promise<Flashcard> {
  const response = await api.post<Flashcard>("/api/flashcards", data);
  return response.data;
}

export async function updateFlashcard(id: string, data: FlashcardFormData): Promise<Flashcard> {
  const response = await api.put<Flashcard>(`/api/flashcards/${id}`, data);
  return response.data;
}

export async function deleteFlashcard(id: string): Promise<void> {
  await api.delete(`/api/flashcards/${id}`);
}

export async function reviewFlashcard(id: string, grade: Grade): Promise<Flashcard> {
  const response = await api.post<Flashcard>(`/api/flashcards/${id}/review`, { grade });
  return response.data;
}
