import { api } from "./api";
import type { CompletionStatus, Habit, HabitFormData } from "../types/habit";

export async function fetchHabits(): Promise<Habit[]> {
  const response = await api.get<Habit[]>("/api/habits");
  return response.data;
}

export async function createHabit(data: HabitFormData): Promise<Habit> {
  const response = await api.post<Habit>("/api/habits", data);
  return response.data;
}

export async function updateHabit(id: string, data: HabitFormData): Promise<Habit> {
  const response = await api.put<Habit>(`/api/habits/${id}`, data);
  return response.data;
}

export async function reorderHabits(order: string[]): Promise<Habit[]> {
  const response = await api.post<Habit[]>("/api/habits/reorder", { order });
  return response.data;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/api/habits/${id}`);
}

export async function setHabitCompletion(
  habitId: string,
  date: string,
  status: CompletionStatus
): Promise<Habit> {
  const response = await api.patch<Habit>(`/api/habits/${habitId}/completion/${date}`, { status });
  return response.data;
}
