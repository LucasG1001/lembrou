import type { DayOfWeek } from "../../types/habit";
import { WEEKDAY_ABBR_PT } from "../../utils/weekdays";
import styles from "./DaySelector.module.css";

interface DaySelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  error?: string;
}

const DAY_LABELS: { value: DayOfWeek; label: string }[] = WEEKDAY_ABBR_PT.map((label, value) => ({
  value: value as DayOfWeek,
  label,
}));

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export function DaySelector({ selectedDays, onChange, error }: DaySelectorProps) {
  const allSelected = selectedDays.length === ALL_DAYS.length;

  function handleToggle(day: DayOfWeek) {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_DAYS]);
  }

  return (
    <div>
      <div className={styles.container}>
        {DAY_LABELS.map(({ value, label }) => {
          const isSelected = selectedDays.includes(value);
          return (
            <button
              key={value}
              type="button"
              className={`${styles.dayButton} ${isSelected ? styles.selected : ""}`}
              onClick={() => handleToggle(value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(value);
                }
              }}
              aria-pressed={isSelected}
              aria-label={label}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button type="button" className={styles.allButton} onClick={toggleAll} aria-pressed={allSelected}>
        {allSelected ? "Limpar" : "Todos os dias"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
