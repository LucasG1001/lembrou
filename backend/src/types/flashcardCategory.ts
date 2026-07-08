export interface FlashcardCategory {
  id: string;
  name: string;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCategoryRow {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardCategoryPatch {
  name?: string;
  color?: string;
}
