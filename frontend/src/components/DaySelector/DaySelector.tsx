import type { DayOfWeek } from "../../types/habit";
import styles from "./DaySelector.module.css";

interface DaySelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  error?: string;
}

const DAY_LABELS: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function DaySelector({ selectedDays, onChange, error }: DaySelectorProps) {
  function handleToggle(day: DayOfWeek) {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
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
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
