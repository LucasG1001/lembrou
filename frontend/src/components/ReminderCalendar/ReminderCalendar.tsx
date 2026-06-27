import { useCallback, useEffect, useState } from "react";
import { formatDateKey, getToday, isSameDay } from "../../utils/dateUtils";
import { MONTH_PT } from "../../utils/month";
import styles from "./ReminderCalendar.module.css";

interface ReminderCalendarProps {
  countByDay: Map<string, number>;
  onClose: () => void;
}

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function ReminderCalendar({ countByDay, onClose }: ReminderCalendarProps) {
  const today = getToday();
  const [view, setView] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePrev = useCallback(() => {
    setView((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }));
  }, []);

  const handleNext = useCallback(() => {
    setView((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }));
  }, []);

  const offset = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1));

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Calendário de lembretes"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <button type="button" className={styles.navButton} onClick={handlePrev} aria-label="Mês anterior">
            ‹
          </button>
          <span className={styles.monthLabel}>
            {MONTH_PT[view.month]} {view.year}
          </span>
          <button type="button" className={styles.navButton} onClick={handleNext} aria-label="Próximo mês">
            ›
          </button>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.weekHeader}>
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className={styles.weekDay}>
              {label}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {Array.from({ length: offset }, (_, i) => (
            <div key={`empty-${i}`} className={styles.emptyCell} />
          ))}

          {days.map((date) => {
            const count = countByDay.get(formatDateKey(date)) ?? 0;
            const todayCell = isSameDay(date, today);
            return (
              <div key={date.getDate()} className={`${styles.dayCell} ${todayCell ? styles.today : ""}`}>
                <span className={styles.dayNumber}>{date.getDate()}</span>
                {count > 0 && <span className={styles.badge}>{count > 9 ? "9+" : count}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
