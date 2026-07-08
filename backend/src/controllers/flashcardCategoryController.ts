import type { Response } from "express";
import { createCategorySchema, updateCategorySchema } from "../schemas/flashcardCategory.js";
import * as categoryModel from "../models/flashcardCategoryModel.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { respondValidationError } from "../lib/validation.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(res: Response, value: string, notFound: string): boolean {
  if (UUID_RE.test(value)) return true;
  res.status(404).json({ error: notFound });
  return false;
}

const CATEGORY_NOT_FOUND = "Categoria não encontrada.";

export const getCategories = asyncHandler("Erro ao buscar categorias.", async (_req, res) => {
  const categories = await categoryModel.findAllCategories();
  res.json(categories);
});

export const createCategory = asyncHandler("Erro ao criar categoria.", async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const category = await categoryModel.createCategory(parsed.data.name, parsed.data.color);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler("Erro ao atualizar categoria.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, CATEGORY_NOT_FOUND)) return;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const category = await categoryModel.updateCategory(id, parsed.data);
  if (!category) {
    res.status(404).json({ error: CATEGORY_NOT_FOUND });
    return;
  }
  res.json(category);
});

export const removeCategory = asyncHandler("Erro ao remover categoria.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, CATEGORY_NOT_FOUND)) return;
  const removed = await categoryModel.removeCategory(id);
  if (!removed) {
    res.status(404).json({ error: CATEGORY_NOT_FOUND });
    return;
  }
  res.status(204).send();
});
