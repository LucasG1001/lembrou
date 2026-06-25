import type { DayOfWeek, HabitCompletion } from "../types/habit";
import { addDays, formatDateKey, getDayOfWeek, getToday, isSameDay } from "./dateUtils";

function isCompletedOnDate(completions: HabitCompletion[], dateKey: string): boolean {
  return completions.some((c) => c.date === dateKey && c.completed);
}

export function calculateCurrentStreak(
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[]
): number {
  const today = getToday();
  const todayKey = formatDateKey(today);
  let streak = 0;
  let date = new Date(today);

  if (selectedDays.includes(getDayOfWeek(today))) {
    if (isCompletedOnDate(completions, todayKey)) {
      streak = 1;
    }
    date = addDays(date, -1);
  } else {
    date = addDays(date, -1);
  }

  while (true) {
    if (!selectedDays.includes(getDayOfWeek(date))) {
      date = addDays(date, -1);
      continue;
    }

    const key = formatDateKey(date);
    if (isCompletedOnDate(completions, key)) {
      streak++;
      date = addDays(date, -1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[],
  createdAt: string
): number {
  const today = getToday();
  const startDate = new Date(createdAt);
  startDate.setHours(0, 0, 0, 0);

  let longest = 0;
  let current = 0;
  let date = new Date(startDate);

  while (date <= today) {
    if (selectedDays.includes(getDayOfWeek(date))) {
      const key = formatDateKey(date);
      const isTodayAndNotDone = isSameDay(date, today) && !isCompletedOnDate(completions, key);

      if (isCompletedOnDate(completions, key)) {
        current++;
        if (current > longest) {
          longest = current;
        }
      } else if (isTodayAndNotDone) {
        // pass
      } else {
        current = 0;
      }
    }
    date = addDays(date, 1);
  }

  return longest;
}

export function hasConsecutiveMissedDays(
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[]
): boolean {
  const today = getToday();
  let missedCount = 0;
  let date = addDays(today, -1);

  for (let i = 0; i < 30; i++) {
    if (selectedDays.includes(getDayOfWeek(date))) {
      const key = formatDateKey(date);
      if (!isCompletedOnDate(completions, key)) {
        missedCount++;
        if (missedCount >= 2) {
          return true;
        }
      } else {
        break;
      }
    }
    date = addDays(date, -1);
  }

  return false;
}
