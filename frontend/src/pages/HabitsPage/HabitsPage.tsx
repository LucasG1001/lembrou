import { useMemo, useState } from "react";
import { useHabits } from "../../hooks/useHabits";
import { Timeline } from "../../components/Timeline/Timeline";
import { SidePanel } from "../../components/SidePanel/SidePanel";
import { HabitForm } from "../../components/HabitForm/HabitForm";
import { CheckIcon } from "../../components/Sidebar/Sidebar.icons";
import { groupByDay, type TimelineItem } from "../../utils/agenda";
import { addDays, formatDateKey, getToday, isScheduledDay } from "../../utils/dateUtils";
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
  const today = getToday();

  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
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
        detail: habit.currentStreak > 0 ? `🔥 ${habit.currentStreak}` : "",
        hasTime: false,
      });
      byId.set(id, { habit, dateKey, completed });
    }
  }

  return { items, byId };
}

export function HabitsPage() {
  const { habits, loading, error, createHabit, updateHabit, deleteHabit, toggleCompletion } = useHabits();

  const [selected, setSelected] = useState<Habit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);

  const { items, byId } = useMemo(() => buildOccurrences(habits), [habits]);
  const weekGroups = useMemo(() => groupByDay(items), [items]);

  // Mantém o painel sincronizado com o estado mais recente do hábito.
  const selectedHabit = selected ? habits.find((h) => h.id === selected.id) ?? null : null;

  const handleSave = (data: HabitFormData) => {
    const action =
      formMode === "edit" && editing
        ? updateHabit(editing.id, data)
        : createHabit(data);
    action.catch(() => undefined).finally(() => {
      setFormMode(null);
      setEditing(null);
    });
  };

  const handleDelete = (id: string) => {
    deleteHabit(id).catch(() => undefined);
    setSelected(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Hábitos</h1>
        <button
          className={styles.newButton}
          onClick={() => {
            setEditing(null);
            setFormMode("create");
          }}
        >
          + Novo hábito
        </button>
      </header>

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
          iconFor={() => CheckIcon}
          onItemClick={(item) => {
            const occ = byId.get(item.id);
            if (occ) setSelected(occ.habit);
          }}
          renderAction={(item) => {
            const occ = byId.get(item.id);
            if (!occ) return null;
            return (
              <button
                className={`${styles.check} ${occ.completed ? styles.checkDone : ""}`}
                aria-label={occ.completed ? "Desmarcar" : "Marcar como feito"}
                aria-pressed={occ.completed}
                onClick={() => toggleCompletion(occ.habit.id, occ.dateKey).catch(() => undefined)}
              >
                {occ.completed ? "✓" : ""}
              </button>
            );
          }}
          emptyMessage="Nenhum hábito agendado para os próximos dias."
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
              ? { name: editing.name, selectedDays: editing.selectedDays }
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
