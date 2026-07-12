import type { FlashcardCategory, FlashcardCategoryFormData } from "../types/flashcardCategory";
import {
  fetchCategories,
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
} from "../services/flashcardCategoryService";
import { useFetchList } from "./useFetchList";

interface UseFlashcardCategoriesReturn {
  categories: FlashcardCategory[];
  loading: boolean;
  error: string | null;
  createCategory: (data: FlashcardCategoryFormData) => Promise<FlashcardCategory>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useFlashcardCategories(): UseFlashcardCategoriesReturn {
  const {
    items: categories,
    setItems: setCategories,
    loading,
    error,
  } = useFetchList<FlashcardCategory>(fetchCategories, "Não foi possível carregar as categorias.");

  async function createCategory(data: FlashcardCategoryFormData): Promise<FlashcardCategory> {
    const created = await apiCreateCategory(data);
    setCategories((prev) => [...prev, created]);
    return created;
  }

  async function deleteCategory(id: string): Promise<void> {
    await apiDeleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return { categories, loading, error, createCategory, deleteCategory };
}
