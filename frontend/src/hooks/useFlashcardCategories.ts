import { useEffect, useState } from "react";
import type { FlashcardCategory, FlashcardCategoryFormData } from "../types/flashcardCategory";
import {
  fetchCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from "../services/flashcardCategoryService";

interface UseFlashcardCategoriesReturn {
  categories: FlashcardCategory[];
  loading: boolean;
  error: string | null;
  createCategory: (data: FlashcardCategoryFormData) => Promise<FlashcardCategory>;
  updateCategory: (id: string, data: Partial<FlashcardCategoryFormData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useFlashcardCategories(): UseFlashcardCategoriesReturn {
  const [categories, setCategories] = useState<FlashcardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError("Não foi possível carregar as categorias."))
      .finally(() => setLoading(false));
  }, []);

  async function createCategory(data: FlashcardCategoryFormData): Promise<FlashcardCategory> {
    const created = await apiCreateCategory(data);
    setCategories((prev) => [...prev, created]);
    return created;
  }

  async function updateCategory(id: string, data: Partial<FlashcardCategoryFormData>): Promise<void> {
    const updated = await apiUpdateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function deleteCategory(id: string): Promise<void> {
    await apiDeleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return { categories, loading, error, createCategory, updateCategory, deleteCategory };
}
