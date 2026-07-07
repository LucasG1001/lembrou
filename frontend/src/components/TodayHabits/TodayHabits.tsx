import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Habit } from "../../types/habit";
import { getToday, getTodayKey, isScheduledDay } from "../../utils/dateUtils";
import { getHabitIcon } from "../../utils/habitIcons";
import { moveRelativeTo } from "../../utils/reorder";
import styles from "./TodayHabits.module.css";

interface TodayHabitsProps {
  habits: Habit[];
  onToggle: (habitId: string, dateKey: string, nextCount: number) => void;
  onReorder: (orderedVisibleIds: string[]) => void;
}

const LONG_PRESS_MS = 400;
const MOVE_THRESHOLD = 10;

export function TodayHabits({ habits, onToggle, onReorder }: TodayHabitsProps) {
  const todayKey = getTodayKey();

  const today = useMemo(() => {
    const date = getToday();
    return habits
      .filter((habit) => isScheduledDay(date, habit.selectedDays))
      .map((habit) => {
        const completion = habit.completions.find((c) => c.date === todayKey);
        const target = Math.max(1, habit.targetCount);
        const count = Math.min(completion?.count ?? 0, target);
        return { habit, count, target, completed: count >= target };
      });
  }, [habits, todayKey]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const draggingIdRef = useRef<string | null>(null);
  const dragOrderRef = useRef<string[] | null>(null);

  const visibleIds = today.map((t) => t.habit.id);
  const entryById = new Map(today.map((t) => [t.habit.id, t]));
  const renderIds = dragOrder ?? visibleIds;
  const canReorder = today.length > 1;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetDrag = () => {
    draggingRef.current = false;
    draggingIdRef.current = null;
    dragOrderRef.current = null;
    setDraggingId(null);
    setDragOrder(null);
  };

  const startDrag = (id: string, baseOrder: string[]) => {
    draggingRef.current = true;
    draggingIdRef.current = id;
    dragOrderRef.current = baseOrder;
    setDraggingId(id);
    setDragOrder(baseOrder);

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-habit-id]");
      const overId = el?.getAttribute("data-habit-id");
      if (!overId || overId === draggingIdRef.current) return;
      const rect = el!.getBoundingClientRect();
      const after = e.clientX > rect.left + rect.width / 2;
      const base = dragOrderRef.current ?? baseOrder;
      const next = moveRelativeTo(base, draggingIdRef.current!, overId, after);
      dragOrderRef.current = next;
      setDragOrder(next);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };

    const onUp = () => {
      cleanup();
      const finalOrder = dragOrderRef.current;
      const changed = !!finalOrder && finalOrder.some((x, i) => x !== baseOrder[i]);
      resetDrag();
      if (changed && finalOrder) onReorder(finalOrder);
    };

    const onCancel = () => {
      cleanup();
      resetDrag();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  if (today.length === 0) {
    return <p className={styles.empty}>Nenhum hábito agendado para hoje.</p>;
  }

  return (
    <div className={styles.grid}>
      {renderIds.map((id) => {
        const entry = entryById.get(id);
        if (!entry) return null;
        const { habit, count, target, completed } = entry;
        const Icon = getHabitIcon(habit.icon);
        const isDragging = draggingId === habit.id;
        const pct = Math.min(100, Math.round((count / target) * 100));
        return (
          <button
            key={habit.id}
            type="button"
            data-habit-id={habit.id}
            className={`${styles.square} ${completed ? styles.done : ""} ${
              isDragging ? styles.dragging : ""
            }`}
            style={{ "--progress": pct } as CSSProperties}
            aria-pressed={completed}
            aria-label={target > 1 ? `${habit.name} (${count}/${target})` : habit.name}
            title={target > 1 ? `${habit.name} — ${count}/${target}` : habit.name}
            onPointerDown={(e) => {
              clearTimer();
              movedRef.current = false;
              draggingRef.current = false;
              startRef.current = { x: e.clientX, y: e.clientY };
              if (canReorder) {
                const base = visibleIds;
                timerRef.current = setTimeout(() => startDrag(habit.id, base), LONG_PRESS_MS);
              }
            }}
            onPointerMove={(e) => {
              if (draggingRef.current) return;
              if (
                Math.abs(e.clientX - startRef.current.x) > MOVE_THRESHOLD ||
                Math.abs(e.clientY - startRef.current.y) > MOVE_THRESHOLD
              ) {
                movedRef.current = true;
                clearTimer();
              }
            }}
            onPointerUp={() => {
              if (draggingRef.current) return;
              clearTimer();
              if (!movedRef.current) {
                const next = count >= target ? 0 : count + 1;
                onToggle(habit.id, todayKey, next);
              }
              movedRef.current = false;
            }}
            onPointerCancel={() => {
              if (draggingRef.current) return;
              clearTimer();
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className={styles.inner}>
              <Icon className={styles.icon} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
