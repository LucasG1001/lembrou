import { useMemo } from "react";
import type { Habit } from "../../types/habit";
import { getToday, getTodayKey, isScheduledDay } from "../../utils/dateUtils";
import { calculateCombinedStreak } from "../../utils/streakUtils";
import { FlameIcon } from "../Sidebar/Sidebar.icons";
import styles from "./HabitsStats.module.css";

interface HabitsStatsProps {
  habits: Habit[];
}

export function HabitsStats({ habits }: HabitsStatsProps) {
  const { doneToday, totalToday, current, longest } = useMemo(() => {
    const today = getToday();
    const todayKey = getTodayKey();
    const scheduled = habits.filter((habit) => isScheduledDay(today, habit.selectedDays));
    const done = scheduled.filter((habit) =>
      habit.completions.some((c) => c.date === todayKey && c.completed)
    ).length;
    const streak = calculateCombinedStreak(habits);
    return { doneToday: done, totalToday: scheduled.length, ...streak };
  }, [habits]);

  const progressPct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  return (
    <div className={styles.stats}>
      <div className={styles.card}>
        <div
          className={styles.ring}
          style={{
            background: `conic-gradient(var(--color-success) ${progressPct}%, var(--color-bg-tertiary) ${progressPct}%)`,
          }}
        >
          <div className={styles.ringInner}>
            <span className={styles.ringValue}>
              {totalToday ? `${doneToday}/${totalToday}` : "—"}
            </span>
          </div>
        </div>
        <div className={styles.cardText}>
          <span className={styles.label}>Progresso de hoje</span>
          <span className={styles.caption}>
            {totalToday === 0
              ? "Nada agendado para hoje"
              : progressPct === 100
                ? "Tudo feito hoje! 🎉"
                : `${progressPct}% concluído`}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <span className={styles.value} style={{ color: "var(--streak-color)" }}>
          <FlameIcon className={styles.flame} /> {current}
        </span>
        <div className={styles.cardText}>
          <span className={styles.label}>Sequência atual</span>
          <span className={styles.caption}>Todos os hábitos em dia</span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardLongest}`}>
        <span className={styles.value}>{longest}</span>
        <div className={styles.cardText}>
          <span className={styles.label}>Maior sequência</span>
          <span className={styles.caption}>Recorde de dias completos</span>
        </div>
      </div>
    </div>
  );
}
