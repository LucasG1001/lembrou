import { del, get, post } from "./api";
import type { FlashcardCategory, FlashcardCategoryFormData } from "../types/flashcardCategory";

export function fetchCategories(): Promise<FlashcardCategory[]> {
  return get<FlashcardCategory[]>("/api/flashcard-categories");
}

export function createCategory(data: FlashcardCategoryFormData): Promise<FlashcardCategory> {
  return post<FlashcardCategory>("/api/flashcard-categories", data);
}

export function deleteCategory(id: string): Promise<void> {
  return del(`/api/flashcard-categories/${id}`);
}
