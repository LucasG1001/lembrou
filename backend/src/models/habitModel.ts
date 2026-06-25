import { pool } from "../database/connection.js";
import type {
  Habit,
  HabitCompletion,
  HabitCompletionRow,
  HabitPatch,
  HabitRow,
  NewHabit,
} from "../types/habit.js";

export class CompletionLockedError extends Error {
  constructor() {
    super("Este registro foi marcado automaticamente e não pode ser desfeito.");
    this.name = "CompletionLockedError";
  }
}

function toHabit(row: HabitRow, completionRows: HabitCompletionRow[]): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    selectedDays: row.selected_days,
    completions: completionRows
      .filter((c) => c.habit_id === row.id)
      .map((c) => ({ date: c.date, completed: c.completed, locked: c.locked })),
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<Habit[]> {
  const habits = await pool.query<HabitRow>("SELECT * FROM habits ORDER BY created_at ASC");
  const completions = await pool.query<HabitCompletionRow>(
    "SELECT habit_id, date, completed, locked FROM habit_completions"
  );
  return habits.rows.map((row) => toHabit(row, completions.rows));
}

export async function findById(id: string): Promise<Habit | null> {
  const habit = await pool.query<HabitRow>("SELECT * FROM habits WHERE id = $1", [id]);
  if (!habit.rows[0]) return null;
  const completions = await pool.query<HabitCompletionRow>(
    "SELECT habit_id, date, completed, locked FROM habit_completions WHERE habit_id = $1",
    [id]
  );
  return toHabit(habit.rows[0], completions.rows);
}

export async function create(entry: NewHabit): Promise<Habit> {
  const result = await pool.query<HabitRow>(
    `INSERT INTO habits (name, selected_days, icon)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [entry.name, entry.selectedDays, entry.icon]
  );
  return toHabit(result.rows[0]!, []);
}

const COLUMN_MAP: Record<keyof HabitPatch, string> = {
  name: "name",
  icon: "icon",
  selectedDays: "selected_days",
};

export async function update(id: string, patch: HabitPatch): Promise<Habit | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(COLUMN_MAP) as [keyof HabitPatch, string][]) {
    const value = patch[key];
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<HabitRow>(
    `UPDATE habits SET ${sets.join(", ")} WHERE id = $${i} RETURNING id`,
    values
  );
  if (!result.rows[0]) return null;
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM habits WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getCompletion(habitId: string, date: string): Promise<HabitCompletion | null> {
  const result = await pool.query<HabitCompletion>(
    "SELECT date, completed, locked FROM habit_completions WHERE habit_id = $1 AND date = $2",
    [habitId, date]
  );
  return result.rows[0] ?? null;
}

export async function setCompletion(
  habitId: string,
  date: string,
  completed: boolean,
  options: { locked?: boolean; force?: boolean } = {}
): Promise<void> {
  const existing = await getCompletion(habitId, date);

  if (existing?.locked && !options.force) {
    throw new CompletionLockedError();
  }

  const locked = options.locked ?? existing?.locked ?? false;

  if (existing) {
    await pool.query(
      "UPDATE habit_completions SET completed = $1, locked = $2 WHERE habit_id = $3 AND date = $4",
      [completed, locked, habitId, date]
    );
  } else {
    await pool.query(
      "INSERT INTO habit_completions (habit_id, date, completed, locked) VALUES ($1, $2, $3, $4)",
      [habitId, date, completed, locked]
    );
  }

  await pool.query("UPDATE habits SET updated_at = NOW() WHERE id = $1", [habitId]);
}

export async function clearCompletion(habitId: string, date: string): Promise<void> {
  const existing = await getCompletion(habitId, date);

  if (existing?.locked) {
    throw new CompletionLockedError();
  }

  await pool.query("DELETE FROM habit_completions WHERE habit_id = $1 AND date = $2", [habitId, date]);
  await pool.query("UPDATE habits SET updated_at = NOW() WHERE id = $1", [habitId]);
}
