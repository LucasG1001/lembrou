import {
  completionStatusSchema,
  createHabitSchema,
  reorderHabitsSchema,
  updateHabitSchema,
} from "../schemas/habit.js";
import * as habitModel from "../models/habitModel.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { DATE_RE, respondValidationError } from "../lib/validation.js";

export const getAll = asyncHandler("Erro ao buscar hábitos.", async (_req, res) => {
  const habits = await habitModel.findAll();
  res.json(habits);
});

export const create = asyncHandler("Erro ao criar hábito.", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const habit = await habitModel.create(parsed.data);
  res.status(201).json(habit);
});

export const update = asyncHandler("Erro ao atualizar hábito.", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const habit = await habitModel.update(String(req.params.id), parsed.data);
  if (!habit) {
    res.status(404).json({ error: "Hábito não encontrado." });
    return;
  }
  res.json(habit);
});

export const reorder = asyncHandler("Erro ao reordenar hábitos.", async (req, res) => {
  const parsed = reorderHabitsSchema.safeParse(req.body);
  if (!parsed.success) {
    respondValidationError(res, parsed.error);
    return;
  }
  const habits = await habitModel.reorder(parsed.data.order);
  res.json(habits);
});

export const remove = asyncHandler("Erro ao remover hábito.", async (req, res) => {
  const removed = await habitModel.remove(String(req.params.id));
  if (!removed) {
    res.status(404).json({ error: "Hábito não encontrado." });
    return;
  }
  res.status(204).send();
});

export const setCompletion = asyncHandler("Erro ao atualizar conclusão.", async (req, res) => {
  const id = String(req.params.id);
  const date = String(req.params.date);
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: "Data inválida (use YYYY-MM-DD)." });
    return;
  }
  const parsed = completionStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  const { status } = parsed.data;
  if (status === "done") {
    await habitModel.setCompletion(id, date, true);
  } else if (status === "notDone") {
    await habitModel.setCompletion(id, date, false);
  } else {
    await habitModel.clearCompletion(id, date);
  }

  const habit = await habitModel.findById(id);
  if (!habit) {
    res.status(404).json({ error: "Hábito não encontrado." });
    return;
  }
  res.json(habit);
});
