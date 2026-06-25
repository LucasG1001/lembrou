import { useState, useEffect, useRef } from "react";
import type { DayOfWeek, HabitFormData } from "../../types/habit";
import { DEFAULT_HABIT_ICON, HABIT_ICONS } from "../../utils/habitIcons";
import { DaySelector } from "../DaySelector/DaySelector";
import { Modal } from "../Modal/Modal";
import styles from "./HabitForm.module.css";

interface HabitFormProps {
  mode: "create" | "edit";
  initialData?: HabitFormData;
  onSave: (data: HabitFormData) => void;
  onClose: () => void;
}

export function HabitForm({ mode, initialData, onSave, onClose }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? DEFAULT_HABIT_ICON);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initialData?.selectedDays ?? []);
  const [daysError, setDaysError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    if (selectedDays.length === 0) {
      setDaysError("Selecione pelo menos um dia");
      return;
    }
    onSave({ name: name.trim(), icon, selectedDays });
  }

  function handleDaysChange(days: DayOfWeek[]) {
    setSelectedDays(days);
    if (days.length > 0) {
      setDaysError("");
    }
  }

  const isValid = name.trim().length > 0 && selectedDays.length > 0;
  const title = mode === "create" ? "Novo hábito" : "Editar hábito";

  return (
    <Modal title={title} onClose={onClose} onSubmit={handleSubmit} submitDisabled={!isValid}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="habit-name">
          Nome
        </label>
        <input
          ref={inputRef}
          id="habit-name"
          type="text"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="Nome do hábito"
          maxLength={60}
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Ícone</span>
        <div className={styles.iconGrid}>
          {HABIT_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`${styles.iconButton} ${icon === emoji ? styles.iconSelected : ""}`}
              onClick={() => setIcon(emoji)}
              aria-pressed={icon === emoji}
              aria-label={`Ícone ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Dias</span>
        <DaySelector selectedDays={selectedDays} onChange={handleDaysChange} error={daysError} />
      </div>
    </Modal>
  );
}
