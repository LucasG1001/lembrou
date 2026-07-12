import { useState, useCallback } from "react";
import type { DayOfWeek, HabitCompletion } from "../../types/habit";
import { formatDateKey, getDayOfWeek, getToday, isSameDay, spCalendarDay } from "../../utils/dateUtils";
import { MONTH_PT } from "../../utils/month";
import { WEEKDAY_LETTERS } from "../../utils/weekdays";
import styles from "./CompletionGrid.module.css";

interface CompletionGridProps {
  completions: HabitCompletion[];
  selectedDays: DayOfWeek[];
  createdAt: string;
}

type DayState = "completed" | "missed" | "pending" | "notScheduled" | "future";

interface CalendarDay {
  day: number;
  date: Date;
  state: DayState;
  isToday: boolean;
}

function getDayState(
  date: Date,
  today: Date,
  createdDay: Date,
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[]
): DayState {
  if (date > today) {
    return "future";
  }

  if (date < createdDay) {
    return "notScheduled";
  }

  const dow = getDayOfWeek(date);
  if (!selectedDays.includes(dow)) {
    return "notScheduled";
  }

  const dateKey = formatDateKey(date);
  const isCompleted = completions.some((c) => c.date === dateKey && c.completed);

  if (isCompleted) {
    return "completed";
  }

  if (isSameDay(date, today)) {
    return "pending";
  }

  return "missed";
}

function buildCalendarDays(
  year: number,
  month: number,
  today: Date,
  createdDay: Date,
  completions: HabitCompletion[],
  selectedDays: DayOfWeek[]
): CalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const state = getDayState(date, today, createdDay, completions, selectedDays);
    days.push({
      day,
      date,
      state,
      isToday: isSameDay(date, today),
    });
  }

  return days;
}

function getFirstDayOffset(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CompletionGrid({ completions, selectedDays, createdAt }: CompletionGridProps) {
  const today = getToday();

  const [viewMonth, setViewMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const createdDay = spCalendarDay(new Date(createdAt));
  const createdYear = createdDay.getFullYear();
  const createdMonth = createdDay.getMonth();

  const canGoPrev =
    viewMonth.year > createdYear ||
    (viewMonth.year === createdYear && viewMonth.month > createdMonth);

  const canGoNext =
    viewMonth.year < today.getFullYear() ||
    (viewMonth.year === today.getFullYear() && viewMonth.month < today.getMonth());

  const handlePrev = useCallback(() => {
    setViewMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const handleNext = useCallback(() => {
    setViewMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const calendarDays = buildCalendarDays(
    viewMonth.year,
    viewMonth.month,
    today,
    createdDay,
    completions,
    selectedDays
  );

  const offset = getFirstDayOffset(viewMonth.year, viewMonth.month);

  const stateClassMap: Record<DayState, string> = {
    completed: styles.completed ?? "",
    missed: styles.missed ?? "",
    pending: styles.pending ?? "",
    notScheduled: styles.notScheduled ?? "",
    future: styles.future ?? "",
  };

  return (
    <div className={styles.container}>
      <div className={styles.navigation}>
        <button
          className={styles.navButton}
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className={styles.monthLabel}>
          {MONTH_PT[viewMonth.month]} {viewMonth.year}
        </span>
        <button
          className={styles.navButton}
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className={styles.weekHeader}>
        {WEEKDAY_LETTERS.map((label, i) => (
          <span key={i} className={styles.weekDay}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: offset }, (_, i) => (
          <div key={`empty-${i}`} className={styles.emptyCell} />
        ))}

        {calendarDays.map(({ day, state, isToday }) => (
          <div
            key={day}
            className={`${styles.dayCell} ${stateClassMap[state]} ${isToday ? styles.today : ""}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendCompleted}`} />
          Feito
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendMissed}`} />
          Perdido
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendPending}`} />
          Pendente hoje
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendNotScheduled}`} />
          Sem agenda
        </span>
      </div>
    </div>
  );
}
