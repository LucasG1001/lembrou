import { useState, useEffect, useCallback, useRef } from "react";
import type { DayOfWeek, HabitFormData } from "../../types/habit";
import { DaySelector } from "../DaySelector/DaySelector";
import styles from "./HabitForm.module.css";

interface HabitFormProps {
  mode: "create" | "edit";
  initialData?: HabitFormData;
  onSave: (data: HabitFormData) => void;
  onClose: () => void;
}

export function HabitForm({ mode, initialData, onSave, onClose }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initialData?.selectedDays ?? []);
  const [daysError, setDaysError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleSubmit() {
    if (selectedDays.length === 0) {
      setDaysError("Selecione pelo menos um dia");
      return;
    }
    onSave({ name: name.trim(), selectedDays });
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
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
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
            <span className={styles.label}>Dias</span>
            <DaySelector selectedDays={selectedDays} onChange={handleDaysChange} error={daysError} />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSubmit} disabled={!isValid}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
