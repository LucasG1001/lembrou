import { pool } from "../database/connection.js";
import { buildUpdateSet } from "../lib/sqlUpdate.js";
import { CompletionLockedError } from "./errors.js";
import type {
  Habit,
  HabitCompletion,
  HabitCompletionRow,
  HabitPatch,
  HabitRow,
  NewHabit,
} from "../types/habit.js";

async function touchHabit(habitId: string): Promise<void> {
  await pool.query("UPDATE habits SET updated_at = NOW() WHERE id = $1", [habitId]);
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
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<Habit[]> {
  const habits = await pool.query<HabitRow>(
    "SELECT * FROM habits ORDER BY position ASC, created_at ASC"
  );
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
    `INSERT INTO habits (name, selected_days, icon, position)
     VALUES ($1, $2, $3, (SELECT COALESCE(MAX(position), -1) + 1 FROM habits))
     RETURNING *`,
    [entry.name, entry.selectedDays, entry.icon]
  );
  return toHabit(result.rows[0]!, []);
}

export async function reorder(orderedIds: string[]): Promise<Habit[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query("UPDATE habits SET position = $1, updated_at = NOW() WHERE id = $2", [
        i,
        orderedIds[i],
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return findAll();
}

const COLUMN_MAP: Record<keyof HabitPatch, string> = {
  name: "name",
  icon: "icon",
  selectedDays: "selected_days",
};

export async function update(id: string, patch: HabitPatch): Promise<Habit | null> {
  const { sets, values, nextIndex } = buildUpdateSet(patch, COLUMN_MAP);

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<HabitRow>(
    `UPDATE habits SET ${sets.join(", ")} WHERE id = $${nextIndex} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  const completions = await pool.query<HabitCompletionRow>(
    "SELECT habit_id, date, completed, locked FROM habit_completions WHERE habit_id = $1",
    [id]
  );
  return toHabit(result.rows[0], completions.rows);
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
  const result = await pool.query(
    `INSERT INTO habit_completions (habit_id, date, completed, locked)
     VALUES ($1, $2, $3, COALESCE($4, FALSE))
     ON CONFLICT (habit_id, date) DO UPDATE
       SET completed = EXCLUDED.completed,
           locked = COALESCE($4, habit_completions.locked)
       WHERE NOT habit_completions.locked OR $5`,
    [habitId, date, completed, options.locked ?? null, options.force ?? false]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new CompletionLockedError();
  }

  await touchHabit(habitId);
}

export async function clearCompletion(habitId: string, date: string): Promise<void> {
  const result = await pool.query(
    "DELETE FROM habit_completions WHERE habit_id = $1 AND date = $2 AND NOT locked",
    [habitId, date]
  );

  if ((result.rowCount ?? 0) === 0) {
    const existing = await getCompletion(habitId, date);
    if (existing?.locked) {
      throw new CompletionLockedError();
    }
    return;
  }

  await touchHabit(habitId);
}
