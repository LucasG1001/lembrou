export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CompletionStatus = "done" | "notDone" | "clear";

export interface HabitCompletion {
  date: string;
  completed: boolean;
  locked: boolean;
}

export interface Habit {
  id: string;
  name: string;
  selectedDays: number[];
  completions: HabitCompletion[];
  currentStreak: number;
  longestStreak: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitRow {
  id: string;
  name: string;
  selected_days: number[];
  current_streak: number;
  longest_streak: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletionRow {
  habit_id: string;
  date: string;
  completed: boolean;
  locked: boolean;
}

export interface NewHabit {
  name: string;
  selectedDays: number[];
}

export interface HabitPatch {
  name?: string;
  selectedDays?: number[];
}
