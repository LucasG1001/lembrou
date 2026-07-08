import { api } from "./api";
import type { FlashcardCategory, FlashcardCategoryFormData } from "../types/flashcardCategory";

export async function fetchCategories(): Promise<FlashcardCategory[]> {
  const response = await api.get<FlashcardCategory[]>("/api/flashcard-categories");
  return response.data;
}

export async function createCategory(data: FlashcardCategoryFormData): Promise<FlashcardCategory> {
  const response = await api.post<FlashcardCategory>("/api/flashcard-categories", data);
  return response.data;
}

export async function updateCategory(
  id: string,
  data: Partial<FlashcardCategoryFormData>
): Promise<FlashcardCategory> {
  const response = await api.put<FlashcardCategory>(`/api/flashcard-categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/flashcard-categories/${id}`);
}
