import { useMemo } from "react";
import { formatDateKey, getToday, isSameDay } from "../../utils/dateUtils";
import { WEEKDAY_LETTERS } from "../../utils/weekdays";
import { getHolidays } from "../../utils/holidays";
import { useDismiss } from "../../hooks/useDismiss";
import { useMonthGrid } from "../../hooks/useMonthGrid";
import styles from "./ReminderCalendar.module.css";

interface ReminderCalendarProps {
  countByDay: Map<string, number>;
  onClose: () => void;
}

export function ReminderCalendar({ countByDay, onClose }: ReminderCalendarProps) {
  const today = getToday();
  const { view, goPrev, goNext, monthLabel, firstDayOffset: offset, days } = useMonthGrid();

  useDismiss(onClose);

  const holidays = useMemo(() => getHolidays(view.year), [view.year]);
  const holidayByDay = useMemo(() => new Map(holidays.map((h) => [h.dateKey, h])), [holidays]);
  const monthHolidays = holidays.filter((h) => Number(h.dateKey.slice(5, 7)) - 1 === view.month);

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
          <button type="button" className={styles.navButton} onClick={goPrev} aria-label="Mês anterior">
            ‹
          </button>
          <span className={styles.monthLabel}>{monthLabel}</span>
          <button type="button" className={styles.navButton} onClick={goNext} aria-label="Próximo mês">
            ›
          </button>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            ×
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

          {days.map((date) => {
            const key = formatDateKey(date);
            const count = countByDay.get(key) ?? 0;
            const holiday = holidayByDay.get(key);
            const todayCell = isSameDay(date, today);
            return (
              <div
                key={date.getDate()}
                className={`${styles.dayCell} ${todayCell ? styles.today : ""} ${
                  holiday ? styles.holiday : ""
                }`}
                title={holiday?.name}
              >
                <span className={styles.dayNumber}>{date.getDate()}</span>
                {count > 0 && <span className={styles.badge}>{count > 9 ? "9+" : count}</span>}
                {holiday && <span className={styles.holidayDot} />}
              </div>
            );
          })}
        </div>

        {monthHolidays.length > 0 && (
          <div className={styles.holidayList}>
            {monthHolidays.map((h) => (
              <div key={h.dateKey} className={styles.holidayItem}>
                <span className={styles.holidayItemDot} />
                <span className={styles.holidayDate}>{h.dateKey.slice(8, 10)}</span>
                <span className={styles.holidayName}>{h.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
