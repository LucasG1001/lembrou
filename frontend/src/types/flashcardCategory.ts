export interface FlashcardCategory {
  id: string;
  name: string;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCategoryFormData {
  name: string;
  color: string;
}
