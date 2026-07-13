import type { DayOfWeek, HabitCompletion } from "../../types/habit";
import { formatDateKey, getDayOfWeek, getToday, isSameDay, spCalendarDay } from "../../utils/dateUtils";
import { WEEKDAY_LETTERS } from "../../utils/weekdays";
import { useMonthGrid } from "../../hooks/useMonthGrid";
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

export function CompletionGrid({ completions, selectedDays, createdAt }: CompletionGridProps) {
  const today = getToday();
  const { view, goPrev, goNext, monthLabel, firstDayOffset, days } = useMonthGrid();

  const createdDay = spCalendarDay(new Date(createdAt));
  const createdYear = createdDay.getFullYear();
  const createdMonth = createdDay.getMonth();

  const canGoPrev =
    view.year > createdYear || (view.year === createdYear && view.month > createdMonth);

  const canGoNext =
    view.year < today.getFullYear() ||
    (view.year === today.getFullYear() && view.month < today.getMonth());

  const calendarDays: CalendarDay[] = days.map((date) => ({
    day: date.getDate(),
    date,
    state: getDayState(date, today, createdDay, completions, selectedDays),
    isToday: isSameDay(date, today),
  }));

  const offset = firstDayOffset;

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
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          className={styles.navButton}
          onClick={goNext}
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
