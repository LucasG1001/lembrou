import { z } from "zod";

const baseHabit = z.object({
  name: z.string().min(1, "Informe um nome.").max(200),
  selectedDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Escolha ao menos um dia."),
});

export const createHabitSchema = baseHabit;

export const updateHabitSchema = baseHabit;

export const completionStatusSchema = z.object({
  status: z.enum(["done", "notDone", "clear"]),
});

export type CreateHabitBody = z.infer<typeof createHabitSchema>;
export type UpdateHabitBody = z.infer<typeof updateHabitSchema>;
