import type { Response } from "express";
import {
  createCardSchema,
  createListSchema,
  createProjectSchema,
  moveCardSchema,
  reorderListsSchema,
  updateCardSchema,
  updateListSchema,
  updateProjectSchema,
} from "../schemas/project.js";
import * as projectModel from "../models/projectModel.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { respondValidationError } from "../lib/validation.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(res: Response, value: string, notFound: string): boolean {
  if (UUID_RE.test(value)) return true;
  res.status(404).json({ error: notFound });
  return false;
}

const PROJECT_NOT_FOUND = "Projeto não encontrado.";
const LIST_NOT_FOUND = "Lista não encontrada.";
const CARD_NOT_FOUND = "Cartão não encontrado.";

export const getProjects = asyncHandler("Erro ao buscar projetos.", async (_req, res) => {
  const projects = await projectModel.findAllProjects();
  res.json(projects);
});

export const getBoard = asyncHandler("Erro ao buscar projeto.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, PROJECT_NOT_FOUND)) return;
  const board = await projectModel.findBoard(id);
  if (!board) {
    res.status(404).json({ error: PROJECT_NOT_FOUND });
    return;
  }
  res.json(board);
});

export const createProject = asyncHandler("Erro ao criar projeto.", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const project = await projectModel.createProject(parsed.data.name);
  res.status(201).json(project);
});

export const updateProject = asyncHandler("Erro ao atualizar projeto.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, PROJECT_NOT_FOUND)) return;
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const project = await projectModel.updateProject(id, parsed.data);
  if (!project) {
    res.status(404).json({ error: PROJECT_NOT_FOUND });
    return;
  }
  res.json(project);
});

export const removeProject = asyncHandler("Erro ao remover projeto.", async (req, res) => {
  const id = String(req.params.id);
  if (!requireUuid(res, id, PROJECT_NOT_FOUND)) return;
  const removed = await projectModel.removeProject(id);
  if (!removed) {
    res.status(404).json({ error: PROJECT_NOT_FOUND });
    return;
  }
  res.status(204).send();
});

export const createList = asyncHandler("Erro ao criar lista.", async (req, res) => {
  const projectId = String(req.params.id);
  if (!requireUuid(res, projectId, PROJECT_NOT_FOUND)) return;
  const parsed = createListSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const list = await projectModel.createList(projectId, parsed.data.name);
  if (!list) {
    res.status(404).json({ error: PROJECT_NOT_FOUND });
    return;
  }
  res.status(201).json(list);
});

export const updateList = asyncHandler("Erro ao atualizar lista.", async (req, res) => {
  const listId = String(req.params.listId);
  if (!requireUuid(res, listId, LIST_NOT_FOUND)) return;
  const parsed = updateListSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const list = await projectModel.updateList(listId, parsed.data);
  if (!list) {
    res.status(404).json({ error: LIST_NOT_FOUND });
    return;
  }
  res.json(list);
});

export const removeList = asyncHandler("Erro ao remover lista.", async (req, res) => {
  const listId = String(req.params.listId);
  if (!requireUuid(res, listId, LIST_NOT_FOUND)) return;
  const removed = await projectModel.removeList(listId);
  if (!removed) {
    res.status(404).json({ error: LIST_NOT_FOUND });
    return;
  }
  res.status(204).send();
});

export const reorderLists = asyncHandler("Erro ao reordenar listas.", async (req, res) => {
  const projectId = String(req.params.id);
  if (!requireUuid(res, projectId, PROJECT_NOT_FOUND)) return;
  const parsed = reorderListsSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const board = await projectModel.reorderLists(projectId, parsed.data.order);
  if (!board) {
    res.status(404).json({ error: PROJECT_NOT_FOUND });
    return;
  }
  res.json(board);
});

export const createCard = asyncHandler("Erro ao criar cartão.", async (req, res) => {
  const listId = String(req.params.listId);
  if (!requireUuid(res, listId, LIST_NOT_FOUND)) return;
  const parsed = createCardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const card = await projectModel.createCard(listId, parsed.data.title);
  if (!card) {
    res.status(404).json({ error: LIST_NOT_FOUND });
    return;
  }
  res.status(201).json(card);
});

export const updateCard = asyncHandler("Erro ao atualizar cartão.", async (req, res) => {
  const cardId = String(req.params.cardId);
  if (!requireUuid(res, cardId, CARD_NOT_FOUND)) return;
  const parsed = updateCardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const card = await projectModel.updateCard(cardId, parsed.data);
  if (!card) {
    res.status(404).json({ error: CARD_NOT_FOUND });
    return;
  }
  res.json(card);
});

export const removeCard = asyncHandler("Erro ao remover cartão.", async (req, res) => {
  const cardId = String(req.params.cardId);
  if (!requireUuid(res, cardId, CARD_NOT_FOUND)) return;
  const removed = await projectModel.removeCard(cardId);
  if (!removed) {
    res.status(404).json({ error: CARD_NOT_FOUND });
    return;
  }
  res.status(204).send();
});

export const moveCard = asyncHandler("Erro ao mover cartão.", async (req, res) => {
  const cardId = String(req.params.cardId);
  if (!requireUuid(res, cardId, CARD_NOT_FOUND)) return;
  const parsed = moveCardSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const board = await projectModel.moveCard(cardId, parsed.data.toListId, parsed.data.position);
  if (!board) {
    res.status(404).json({ error: CARD_NOT_FOUND });
    return;
  }
  res.json(board);
});
