import { useMemo } from "react";
import type { Habit } from "../../types/habit";
import { getToday, getTodayKey, isScheduledDay } from "../../utils/dateUtils";
import { getHabitIcon } from "../../utils/habitIcons";
import styles from "./TodayHabits.module.css";

interface TodayHabitsProps {
  habits: Habit[];
  onToggle: (habitId: string, dateKey: string, completed: boolean) => void;
}

export function TodayHabits({ habits, onToggle }: TodayHabitsProps) {
  const todayKey = getTodayKey();

  const today = useMemo(() => {
    const date = getToday();
    return habits
      .filter((habit) => isScheduledDay(date, habit.selectedDays))
      .map((habit) => ({
        habit,
        completed: habit.completions.some((c) => c.date === todayKey && c.completed),
      }));
  }, [habits, todayKey]);

  if (today.length === 0) {
    return <p className={styles.empty}>Nenhum hábito agendado para hoje.</p>;
  }

  return (
    <div className={styles.grid}>
      {today.map(({ habit, completed }) => {
        const Icon = getHabitIcon(habit.icon);
        return (
          <button
            key={habit.id}
            type="button"
            className={`${styles.square} ${completed ? styles.done : ""}`}
            onClick={() => onToggle(habit.id, todayKey, completed)}
            aria-pressed={completed}
            aria-label={habit.name}
            title={habit.name}
          >
            <Icon className={styles.icon} />
          </button>
        );
      })}
    </div>
  );
}
