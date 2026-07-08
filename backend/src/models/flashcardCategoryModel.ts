import { pool } from "../database/connection.js";
import { buildUpdateSet } from "../lib/sqlUpdate.js";
import type {
  FlashcardCategory,
  FlashcardCategoryPatch,
  FlashcardCategoryRow,
} from "../types/flashcardCategory.js";

function toCategory(row: FlashcardCategoryRow): FlashcardCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllCategories(): Promise<FlashcardCategory[]> {
  const result = await pool.query<FlashcardCategoryRow>(
    "SELECT * FROM flashcard_categories ORDER BY position ASC, created_at ASC"
  );
  return result.rows.map(toCategory);
}

export async function findCategoryById(id: string): Promise<FlashcardCategory | null> {
  const result = await pool.query<FlashcardCategoryRow>(
    "SELECT * FROM flashcard_categories WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toCategory(result.rows[0]) : null;
}

export async function createCategory(name: string, color: string): Promise<FlashcardCategory> {
  const result = await pool.query<FlashcardCategoryRow>(
    `INSERT INTO flashcard_categories (name, color, position)
     VALUES ($1, $2, (SELECT COALESCE(MAX(position), -1) + 1 FROM flashcard_categories))
     RETURNING *`,
    [name, color]
  );
  return toCategory(result.rows[0]!);
}

export async function updateCategory(
  id: string,
  patch: FlashcardCategoryPatch
): Promise<FlashcardCategory | null> {
  const { sets, values, nextIndex } = buildUpdateSet(patch, { name: "name", color: "color" });
  if (sets.length === 0) return findCategoryById(id);
  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<FlashcardCategoryRow>(
    `UPDATE flashcard_categories SET ${sets.join(", ")} WHERE id = $${nextIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toCategory(result.rows[0]) : null;
}

export async function removeCategory(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM flashcard_categories WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
