import type { Response } from "express";
import {
  createFlashcardSchema,
  reviewFlashcardSchema,
  updateFlashcardSchema,
} from "../schemas/flashcard.js";
import * as flashcardModel from "../models/flashcardModel.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { respondValidationError } from "../lib/validation.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(res: Response, value: string, notFound: string): boolean {
  if (UUID_RE.test(value)) return true;
  res.status(404).json({ error: notFound });
  return false;
}

const FLASHCARD_NOT_FOUND = "Flashcard não encontrado.";

export const getFlashcards = asyncHandler("Erro ao buscar flashcards.", async (_req, res) => {
  const flashcards = await flashcardModel.findAllSummaries();
  res.json(flashcards);
});

export const getDueFlashcards = asyncHandler("Erro ao buscar flashcards.", async (_req, res) => {
  const flashcards = await flashcardModel.findDue();
  res.json(flashcards);
});

export const getFlashcard = asyncHandler("Erro ao buscar flashcard.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, FLASHCARD_NOT_FOUND)) return;
  const flashcard = await flashcardModel.findById(id);
  if (!flashcard) {
    res.status(404).json({ error: FLASHCARD_NOT_FOUND });
    return;
  }
  res.json(flashcard);
});

export const createFlashcard = asyncHandler("Erro ao criar flashcard.", async (req, res) => {
  const parsed = createFlashcardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const flashcard = await flashcardModel.createFlashcard(parsed.data);
  res.status(201).json(flashcard);
});

export const updateFlashcard = asyncHandler("Erro ao atualizar flashcard.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, FLASHCARD_NOT_FOUND)) return;
  const parsed = updateFlashcardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const flashcard = await flashcardModel.updateFlashcard(id, parsed.data);
  if (!flashcard) {
    res.status(404).json({ error: FLASHCARD_NOT_FOUND });
    return;
  }
  res.json(flashcard);
});

export const reviewFlashcard = asyncHandler("Erro ao revisar flashcard.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, FLASHCARD_NOT_FOUND)) return;
  const parsed = reviewFlashcardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const flashcard = await flashcardModel.reviewFlashcard(id, parsed.data.correct, new Date());
  if (!flashcard) {
    res.status(404).json({ error: FLASHCARD_NOT_FOUND });
    return;
  }
  res.json(flashcard);
});

export const removeFlashcard = asyncHandler("Erro ao remover flashcard.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, FLASHCARD_NOT_FOUND)) return;
  const removed = await flashcardModel.removeFlashcard(id);
  if (!removed) {
    res.status(404).json({ error: FLASHCARD_NOT_FOUND });
    return;
  }
  res.status(204).send();
});
