import { createElement } from "react";
import type { Habit } from "../../types/habit";
import { formatDateDisplay } from "../../utils/dateUtils";
import { getLevelColor } from "../../utils/levelUtils";
import { getHabitIcon } from "../../utils/habitIcons";
import { useDismiss } from "../../hooks/useDismiss";
import { ConfirmButton } from "../ConfirmButton/ConfirmButton";
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
  useDismiss(onClose);

  const levelColor = getLevelColor(habit.level);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-label={`Detalhes de ${habit.name}`}>
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
            {createElement(getHabitIcon(habit.icon), { className: styles.habitIcon })}
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
            <ConfirmButton
              className={styles.deleteButton}
              confirmClassName={styles.deleteConfirm}
              idleLabel="Excluir hábito"
              confirmLabel="Confirmar exclusão?"
              onConfirm={() => {
                onDelete(habit.id);
                onClose();
              }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
