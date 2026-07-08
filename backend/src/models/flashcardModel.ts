import { pool } from "../database/connection.js";
import { buildUpdateSet } from "../lib/sqlUpdate.js";
import { review } from "../services/flashcardScheduler.js";
import type {
  Flashcard,
  FlashcardPatch,
  FlashcardRow,
  FlashcardSummary,
  FlashcardSummaryRow,
  NewFlashcard,
} from "../types/flashcard.js";

const SUMMARY_COLUMNS =
  "id, question, answer, category_id, box, next_review_at, last_reviewed_at, created_at, updated_at";

function toFlashcardSummary(row: FlashcardSummaryRow): FlashcardSummary {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    categoryId: row.category_id,
    box: row.box,
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFlashcard(row: FlashcardRow): Flashcard {
  return {
    ...toFlashcardSummary(row),
    questionImages: row.question_images,
    answerImages: row.answer_images,
  };
}

export async function findAllSummaries(): Promise<FlashcardSummary[]> {
  const result = await pool.query<FlashcardSummaryRow>(
    `SELECT ${SUMMARY_COLUMNS} FROM flashcards ORDER BY created_at DESC`
  );
  return result.rows.map(toFlashcardSummary);
}

export async function findDue(): Promise<Flashcard[]> {
  const result = await pool.query<FlashcardRow>(
    "SELECT * FROM flashcards WHERE next_review_at <= NOW() ORDER BY next_review_at ASC, created_at ASC"
  );
  return result.rows.map(toFlashcard);
}

export async function findById(id: string): Promise<Flashcard | null> {
  const result = await pool.query<FlashcardRow>("SELECT * FROM flashcards WHERE id = $1", [id]);
  return result.rows[0] ? toFlashcard(result.rows[0]) : null;
}

export async function createFlashcard(data: NewFlashcard): Promise<Flashcard> {
  const result = await pool.query<FlashcardRow>(
    `INSERT INTO flashcards (question, answer, question_images, answer_images, category_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.question, data.answer, data.questionImages, data.answerImages, data.categoryId]
  );
  return toFlashcard(result.rows[0]!);
}

export async function updateFlashcard(id: string, patch: FlashcardPatch): Promise<Flashcard | null> {
  const { sets, values, nextIndex } = buildUpdateSet(patch, {
    question: "question",
    answer: "answer",
    questionImages: "question_images",
    answerImages: "answer_images",
    categoryId: "category_id",
  });
  if (sets.length === 0) return findById(id);
  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<FlashcardRow>(
    `UPDATE flashcards SET ${sets.join(", ")} WHERE id = $${nextIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toFlashcard(result.rows[0]) : null;
}

export async function reviewFlashcard(id: string, correct: boolean, now: Date): Promise<Flashcard | null> {
  const existing = await pool.query<FlashcardRow>("SELECT box FROM flashcards WHERE id = $1", [id]);
  const row = existing.rows[0];
  if (!row) return null;

  const outcome = review(row.box, correct, now);

  const result = await pool.query<FlashcardRow>(
    `UPDATE flashcards
     SET box = $1, next_review_at = $2, last_reviewed_at = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [outcome.box, outcome.nextReviewAt, now, id]
  );
  return result.rows[0] ? toFlashcard(result.rows[0]) : null;
}

export async function removeFlashcard(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM flashcards WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
