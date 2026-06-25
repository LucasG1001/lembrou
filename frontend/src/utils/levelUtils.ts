import type { DayOfWeek, HabitCompletion } from "../types/habit";
import { hasConsecutiveMissedDays } from "./streakUtils";

const LEVEL_ICONS: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🪴",
  4: "🌳",
  5: "⭐",
  6: "🔥",
  7: "💎",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "var(--level-1)",
  2: "var(--level-2)",
  3: "var(--level-3)",
  4: "var(--level-4)",
  5: "var(--level-5)",
  6: "var(--level-6)",
  7: "var(--level-7)",
};

export function getLevelIcon(level: number): string {
  if (level >= 8) return "👑";
  return LEVEL_ICONS[level] ?? "🌱";
}

export function getLevelColor(level: number): string {
  if (level >= 8) return "var(--level-8)";
  return LEVEL_COLORS[level] ?? "var(--level-1)";
}

export function calculateLevel(
  longestStreak: number,
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[]
): number {
  let level = Math.floor(longestStreak / 30) + 1;

  if (hasConsecutiveMissedDays(completions, selectedDays)) {
    level = level - 1;
  }

  return Math.max(1, level);
}
