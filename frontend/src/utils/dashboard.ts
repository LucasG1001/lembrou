import type { Reminder } from "../types/reminder";
import type { Habit } from "../types/habit";
import { getToday, getTodayKey, isScheduledDay } from "./dateUtils";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReminderSummary {
  todayCount: number;
  weekCount: number;
  activeCount: number;
  awaiting: Reminder[];
  next: Reminder | null;
}

export function summarizeReminders(reminders: Reminder[]): ReminderSummary {
  const now = Date.now();
  const start = getToday().getTime();
  const todayEnd = start + DAY_MS;
  const weekEnd = start + 7 * DAY_MS;

  let todayCount = 0;
  let weekCount = 0;
  const awaiting: Reminder[] = [];
  let next: Reminder | null = null;

  for (const reminder of reminders) {
    const when = Date.parse(reminder.eventAt);
    if (when >= start && when < todayEnd) todayCount += 1;
    if (when >= start && when < weekEnd) weekCount += 1;
    if (reminder.notifyCount > 0 && !reminder.acknowledged) awaiting.push(reminder);
    if (when >= now && (next === null || when < Date.parse(next.eventAt))) next = reminder;
  }

  return { todayCount, weekCount, activeCount: reminders.length, awaiting, next };
}

export interface HabitToday {
  habit: Habit;
  completed: boolean;
}

export interface HabitSummary {
  today: HabitToday[];
  doneToday: number;
  totalToday: number;
  bestStreak: number;
  recordStreak: number;
  topLevel: number;
  habitCount: number;
}

export function summarizeHabits(habits: Habit[]): HabitSummary {
  const today = getToday();
  const todayKey = getTodayKey();
  const todayList: HabitToday[] = [];

  let bestStreak = 0;
  let recordStreak = 0;
  let topLevel = 0;

  for (const habit of habits) {
    bestStreak = Math.max(bestStreak, habit.currentStreak);
    recordStreak = Math.max(recordStreak, habit.longestStreak);
    topLevel = Math.max(topLevel, habit.level);
    if (isScheduledDay(today, habit.selectedDays)) {
      const completion = habit.completions.find((c) => c.date === todayKey);
      todayList.push({ habit, completed: Boolean(completion?.completed) });
    }
  }

  const doneToday = todayList.filter((entry) => entry.completed).length;

  return {
    today: todayList,
    doneToday,
    totalToday: todayList.length,
    bestStreak,
    recordStreak,
    topLevel,
    habitCount: habits.length,
  };
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function urgencyStyle(when: number): { borderLeftColor: string } | undefined {
  const hours = (when - Date.now()) / 3_600_000;
  if (hours >= 24) return undefined;
  const intensity = Math.max(0, Math.min(1, 1 - hours / 24));
  const alpha = (0.25 + intensity * 0.6).toFixed(2);
  return { borderLeftColor: `rgba(239, 68, 68, ${alpha})` };
}

export function formatRelative(iso: string): string {
  const diff = Date.parse(iso) - Date.now();
  if (diff <= 0) return "agora";
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `em ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "amanhã" : `em ${days} dias`;
}
