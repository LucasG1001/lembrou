import type { Request, Response } from "express";
import { createReminderSchema, updateReminderSchema } from "../schemas/reminder.js";
import * as reminderModel from "../models/reminderModel.js";
import { parseEventAt } from "../lib/dateUtils.js";
import { respondValidationError } from "../lib/validation.js";
import { finishOccurrence, initialSchedule } from "../services/reminderStateMachine.js";
import type { ReminderStatus } from "../types/reminder.js";

const VALID_STATUS: ReminderStatus[] = ["active", "done", "cancelled"];

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const filter = status && VALID_STATUS.includes(status as ReminderStatus) ? (status as ReminderStatus) : undefined;
    const reminders = await reminderModel.findAll(filter);
    res.json(reminders);
  } catch {
    res.status(500).json({ error: "Erro ao buscar lembretes." });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const reminder = await reminderModel.findById(String(req.params.id));
    if (!reminder) {
      res.status(404).json({ error: "Lembrete não encontrado." });
      return;
    }
    res.json(reminder);
  } catch {
    res.status(500).json({ error: "Erro ao buscar lembrete." });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createReminderSchema.safeParse(req.body);
    if (!parsed.success) {
      respondValidationError(res, parsed.error);
      return;
    }
    const body = parsed.data;
    const isAllDay = !body.time;
    const eventAt = parseEventAt(body.date, body.time ?? null);
    const sched = initialSchedule(eventAt, isAllDay, new Date());

    const reminder = await reminderModel.create({
      title: body.title,
      notes: body.notes ?? null,
      eventAt,
      isAllDay,
      recurInterval: body.recurInterval ?? null,
      recurUnit: body.recurUnit ?? null,
      recurWeekday: body.recurWeekday ?? null,
      maxNotify: body.maxNotify ?? 10,
      phase: sched.phase,
      nextNotifyAt: sched.nextNotifyAt,
    });
    res.status(201).json(reminder);
  } catch {
    res.status(500).json({ error: "Erro ao criar lembrete." });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const existing = await reminderModel.findById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: "Lembrete não encontrado." });
      return;
    }
    const parsed = updateReminderSchema.safeParse(req.body);
    if (!parsed.success) {
      respondValidationError(res, parsed.error);
      return;
    }
    const body = parsed.data;
    const isAllDay = !body.time;
    const eventAt = parseEventAt(body.date, body.time ?? null);
    const sched = initialSchedule(eventAt, isAllDay, new Date());

    // Editar reinicia o ciclo de notificações (cobre o "Outro horário").
    const reminder = await reminderModel.update(existing.id, {
      title: body.title,
      notes: body.notes ?? null,
      eventAt,
      isAllDay,
      recurInterval: body.recurInterval ?? null,
      recurUnit: body.recurUnit ?? null,
      recurWeekday: body.recurWeekday ?? null,
      maxNotify: body.maxNotify ?? existing.maxNotify,
      status: "active",
      phase: sched.phase,
      nextNotifyAt: sched.nextNotifyAt,
      notifyCount: 0,
      acknowledged: false,
      acknowledgedAt: null,
    });
    res.json(reminder);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar lembrete." });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const removed = await reminderModel.remove(String(req.params.id));
    if (!removed) {
      res.status(404).json({ error: "Lembrete não encontrado." });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erro ao remover lembrete." });
  }
}

export async function acknowledge(req: Request, res: Response): Promise<void> {
  try {
    const reminder = await reminderModel.findById(String(req.params.id));
    if (!reminder) {
      res.status(404).json({ error: "Lembrete não encontrado." });
      return;
    }
    const now = new Date();
    const patch = finishOccurrence(reminder, now);
    if (patch.status === "done") {
      patch.acknowledged = true;
      patch.acknowledgedAt = now;
    }
    const updated = await reminderModel.update(reminder.id, patch);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao confirmar lembrete." });
  }
}

export async function cancel(req: Request, res: Response): Promise<void> {
  try {
    const reminder = await reminderModel.findById(String(req.params.id));
    if (!reminder) {
      res.status(404).json({ error: "Lembrete não encontrado." });
      return;
    }
    const updated = await reminderModel.update(reminder.id, { status: "cancelled", nextNotifyAt: null });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao cancelar lembrete." });
  }
}
