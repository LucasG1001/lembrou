import type { Request, Response } from "express";
import { completionStatusSchema, createHabitSchema, updateHabitSchema } from "../schemas/habit.js";
import * as habitModel from "../models/habitModel.js";
import { CompletionLockedError } from "../models/habitModel.js";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export async function getAll(_req: Request, res: Response): Promise<void> {
  try {
    const habits = await habitModel.findAll();
    res.json(habits);
  } catch {
    res.status(500).json({ error: "Erro ao buscar hábitos." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }
    const habit = await habitModel.create(parsed.data);
    res.status(201).json(habit);
  } catch {
    res.status(500).json({ error: "Erro ao criar hábito." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const parsed = updateHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }
    const habit = await habitModel.update(String(req.params.id), parsed.data);
    if (!habit) {
      res.status(404).json({ error: "Hábito não encontrado." });
      return;
    }
    res.json(habit);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar hábito." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const removed = await habitModel.remove(String(req.params.id));
    if (!removed) {
      res.status(404).json({ error: "Hábito não encontrado." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover hábito." });
  }
}

export async function toggle(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const date = String(req.params.date);
    if (!dateRe.test(date)) {
      res.status(400).json({ error: "Data inválida (use YYYY-MM-DD)." });
      return;
    }

    const existing = await habitModel.getCompletion(id, date);
    if (!existing) {
      await habitModel.setCompletion(id, date, true);
    } else if (existing.completed) {
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
  } catch (error) {
    if (error instanceof CompletionLockedError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro ao atualizar conclusão." });
  }
}

export async function setCompletion(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const date = String(req.params.date);
    if (!dateRe.test(date)) {
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
  } catch (error) {
    if (error instanceof CompletionLockedError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Erro ao atualizar conclusão." });
  }
}
