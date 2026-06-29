import { useEffect, useState } from "react";
import type { CompletionStatus, Habit, HabitFormData } from "../types/habit";
import {
  fetchHabits,
  createHabit as apiCreateHabit,
  updateHabit as apiUpdateHabit,
  deleteHabit as apiDeleteHabit,
  reorderHabits as apiReorderHabits,
  setHabitCompletion,
} from "../services/habitService";
import { calculateCurrentStreak, calculateLongestStreak } from "../utils/streakUtils";
import { calculateLevel } from "../utils/levelUtils";

interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  createHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: string, data: HabitFormData) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;
  setCompletion: (habitId: string, date: string, status: CompletionStatus) => Promise<void>;
}

function recalculateHabitStats(habit: Habit): Habit {
  const currentStreak = calculateCurrentStreak(habit.completions, habit.selectedDays);
  const longestStreak = calculateLongestStreak(habit.completions, habit.selectedDays, habit.createdAt);
  const level = calculateLevel(longestStreak, habit.completions, habit.selectedDays);
  return { ...habit, currentStreak, longestStreak, level };
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits()
      .then((data) => setHabits(data.map(recalculateHabitStats)))
      .catch(() => setError("Não foi possível carregar os hábitos."))
      .finally(() => setLoading(false));
  }, []);

  async function createHabit(data: HabitFormData): Promise<void> {
    const created = await apiCreateHabit(data);
    setHabits((prev) => [...prev, recalculateHabitStats(created)]);
  }

  async function updateHabit(id: string, data: HabitFormData): Promise<void> {
    const updated = await apiUpdateHabit(id, data);
    setHabits((prev) => prev.map((h) => (h.id === id ? recalculateHabitStats(updated) : h)));
  }

  async function deleteHabit(id: string): Promise<void> {
    await apiDeleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  async function setCompletion(habitId: string, date: string, status: CompletionStatus): Promise<void> {
    const updated = await setHabitCompletion(habitId, date, status);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? recalculateHabitStats(updated) : h)));
  }

  async function reorderHabits(orderedIds: string[]): Promise<void> {
    let previous: Habit[] = [];
    setHabits((prev) => {
      previous = prev;
      const byId = new Map(prev.map((h) => [h.id, h]));
      const next = orderedIds.map((id) => byId.get(id)).filter((h): h is Habit => Boolean(h));
      return next.length === prev.length ? next : prev;
    });
    try {
      const updated = await apiReorderHabits(orderedIds);
      setHabits(updated.map(recalculateHabitStats));
    } catch {
      setHabits(previous);
    }
  }

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    setCompletion,
  };
}
