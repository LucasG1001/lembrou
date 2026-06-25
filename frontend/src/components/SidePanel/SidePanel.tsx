import { useState, useEffect, useCallback } from "react";
import type { Habit } from "../../types/habit";
import { formatDateDisplay } from "../../utils/dateUtils";
import { getLevelColor } from "../../utils/levelUtils";
import { LevelBadge } from "../LevelBadge/LevelBadge";
import { CompletionGrid } from "../CompletionGrid/CompletionGrid";
import styles from "./SidePanel.module.css";

interface SidePanelProps {
  habit: Habit;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export function SidePanel({ habit, onClose, onEdit, onDelete }: SidePanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  function handleBackdropClick() {
    setConfirmDelete(false);
    onClose();
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(habit.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  }

  function handlePanelClick(e: React.MouseEvent) {
    if (confirmDelete) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.deleteButton}`)) {
        setConfirmDelete(false);
      }
    }
  }

  const levelColor = getLevelColor(habit.level);

  return (
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick} aria-hidden="true" />
      <aside
        className={styles.panel}
        role="dialog"
        aria-label={`Detalhes de ${habit.name}`}
        onClick={handlePanelClick}
      >
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar painel">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.badgeContainer}>
            <LevelBadge level={habit.level} size="large" />
          </div>
          <span className={styles.levelText} style={{ color: levelColor }}>
            Nível {habit.level}
          </span>

          <h2 className={styles.habitName}>
            <span className={styles.habitIcon} aria-hidden="true">
              {habit.icon}
            </span>
            {habit.name}
          </h2>

          <div className={styles.divider} />

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: "var(--streak-color)" }}>
                {habit.currentStreak}
              </span>
              <span className={styles.metricLabel}>Sequência atual</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{habit.longestStreak}</span>
              <span className={styles.metricLabel}>Maior sequência</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.gridContainer}>
            <CompletionGrid
              completions={habit.completions}
              selectedDays={habit.selectedDays}
              createdAt={habit.createdAt}
            />
          </div>

          <div className={styles.divider} />

          <span className={styles.createdAt}>Criado em: {formatDateDisplay(habit.createdAt)}</span>

          <div className={styles.actions}>
            <button className={styles.editButton} onClick={() => onEdit(habit)}>
              Editar hábito
            </button>
            <button
              className={`${styles.deleteButton} ${confirmDelete ? styles.deleteConfirm : ""}`}
              onClick={handleDeleteClick}
            >
              {confirmDelete ? "Confirmar exclusão?" : "Excluir hábito"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
