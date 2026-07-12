import { createCategorySchema, updateCategorySchema } from "../schemas/flashcardCategory.js";
import * as categoryModel from "../models/flashcardCategoryModel.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { parseBody, requireUuid } from "../lib/validation.js";

const CATEGORY_NOT_FOUND = "Categoria não encontrada.";

export const getCategories = asyncHandler("Erro ao buscar categorias.", async (_req, res) => {
  const categories = await categoryModel.findAllCategories();
  res.json(categories);
});

export const createCategory = asyncHandler("Erro ao criar categoria.", async (req, res) => {
  const body = parseBody(res, createCategorySchema, req.body);
  if (!body) return;
  const category = await categoryModel.createCategory(body.name, body.color);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler("Erro ao atualizar categoria.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, CATEGORY_NOT_FOUND)) return;
  const body = parseBody(res, updateCategorySchema, req.body);
  if (!body) return;
  const category = await categoryModel.updateCategory(id, body);
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
