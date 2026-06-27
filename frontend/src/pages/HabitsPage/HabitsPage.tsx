import { useCallback, useMemo, useState } from "react";
import { useHabits } from "../../hooks/useHabits";
import { Timeline } from "../../components/Timeline/Timeline";
import { SidePanel } from "../../components/SidePanel/SidePanel";
import { HabitForm } from "../../components/HabitForm/HabitForm";
import { HabitsStats } from "../../components/HabitsStats/HabitsStats";
import { TodayHabits } from "../../components/TodayHabits/TodayHabits";
import { groupByDay, type TimelineItem } from "../../utils/agenda";
import { formatDateKey, getToday, isScheduledDay } from "../../utils/dateUtils";
import { getHabitIcon } from "../../utils/habitIcons";
import type { Habit, HabitFormData } from "../../types/habit";
import styles from "./HabitsPage.module.css";

interface Occurrence {
  habit: Habit;
  dateKey: string;
  completed: boolean;
}

function buildOccurrences(habits: Habit[]): { items: TimelineItem[]; byId: Map<string, Occurrence> } {
  const items: TimelineItem[] = [];
  const byId = new Map<string, Occurrence>();
  const date = getToday();
  const dateKey = formatDateKey(date);

  for (const habit of habits) {
    if (!isScheduledDay(date, habit.selectedDays)) continue;
    const completion = habit.completions.find((c) => c.date === dateKey);
    const completed = Boolean(completion?.completed);
    const id = `${habit.id}:${dateKey}`;
    items.push({
      id,
      kind: "habit",
      title: habit.name,
      when: date.getTime(),
      detail: `Nível ${habit.level}`,
      hasTime: false,
      done: completed,
    });
    byId.set(id, { habit, dateKey, completed });
  }

  return { items, byId };
}

export function HabitsPage() {
  const { habits, loading, error, createHabit, updateHabit, deleteHabit, setCompletion } = useHabits();

  const [selected, setSelected] = useState<Habit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);

  const { items, byId } = useMemo(() => buildOccurrences(habits), [habits]);
  const weekGroups = useMemo(() => groupByDay(items), [items]);

  // Mantém o painel sincronizado com o estado mais recente do hábito.
  const selectedHabit = selected ? habits.find((h) => h.id === selected.id) ?? null : null;

  const handleSave = useCallback(
    (data: HabitFormData) => {
      const action =
        formMode === "edit" && editing
          ? updateHabit(editing.id, data)
          : createHabit(data);
      action.catch(() => undefined).finally(() => {
        setFormMode(null);
        setEditing(null);
      });
    },
    [formMode, editing, updateHabit, createHabit]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteHabit(id).catch(() => undefined);
      setSelected(null);
    },
    [deleteHabit]
  );

  const iconForHabit = useCallback(
    (item: TimelineItem) => getHabitIcon(byId.get(item.id)?.habit.icon ?? ""),
    [byId]
  );

  const handleItemClick = useCallback(
    (item: TimelineItem) => {
      const occ = byId.get(item.id);
      if (occ) setSelected(occ.habit);
    },
    [byId]
  );

  const handleToggle = useCallback(
    (habitId: string, dateKey: string, completed: boolean) =>
      setCompletion(habitId, dateKey, completed ? "clear" : "done").catch(() => undefined),
    [setCompletion]
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.newButton}
          aria-label="Novo hábito"
          onClick={() => {
            setEditing(null);
            setFormMode("create");
          }}
        >
          <span className={styles.newPlus} aria-hidden="true">+</span>
          <span className={styles.newLabel}>Novo hábito</span>
        </button>
      </header>

      {!loading && !error && habits.length > 0 && (
        <>
          <HabitsStats habits={habits} />
          <TodayHabits habits={habits} onToggle={handleToggle} />
        </>
      )}

      {loading && <p className={styles.muted}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && habits.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum hábito ainda</p>
          <p className={styles.muted}>Crie um hábito e acompanhe sua sequência por aqui.</p>
          <button
            className={styles.emptyButton}
            onClick={() => {
              setEditing(null);
              setFormMode("create");
            }}
          >
            + Novo hábito
          </button>
        </div>
      )}

      {!loading && !error && habits.length > 0 && (
        <Timeline
          weekGroups={weekGroups}
          laterGroups={[]}
          iconFor={iconForHabit}
          onItemClick={handleItemClick}
          emptyMessage="Nenhum hábito agendado para hoje."
        />
      )}

      {selectedHabit && (
        <SidePanel
          habit={selectedHabit}
          onClose={() => setSelected(null)}
          onEdit={(habit) => {
            setSelected(null);
            setEditing(habit);
            setFormMode("edit");
          }}
          onDelete={handleDelete}
        />
      )}

      {formMode && (
        <HabitForm
          mode={formMode}
          initialData={
            formMode === "edit" && editing
              ? { name: editing.name, icon: editing.icon, selectedDays: editing.selectedDays }
              : undefined
          }
          onSave={handleSave}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
