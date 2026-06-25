import { api } from "./api";
import type { Reminder, ReminderInput, ReminderStatus } from "../types/reminder";

export async function fetchReminders(status?: ReminderStatus): Promise<Reminder[]> {
  const response = await api.get<Reminder[]>("/api/reminders", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function fetchReminder(id: string): Promise<Reminder> {
  const response = await api.get<Reminder>(`/api/reminders/${id}`);
  return response.data;
}

export async function createReminder(input: ReminderInput): Promise<Reminder> {
  const response = await api.post<Reminder>("/api/reminders", input);
  return response.data;
}

export async function updateReminder(id: string, input: ReminderInput): Promise<Reminder> {
  const response = await api.put<Reminder>(`/api/reminders/${id}`, input);
  return response.data;
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(`/api/reminders/${id}`);
}

export async function acknowledgeReminder(id: string): Promise<Reminder> {
  const response = await api.post<Reminder>(`/api/reminders/${id}/acknowledge`);
  return response.data;
}

export async function cancelReminder(id: string): Promise<Reminder> {
  const response = await api.post<Reminder>(`/api/reminders/${id}/cancel`);
  return response.data;
}
