import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClockIcon } from "../Sidebar/Sidebar.icons";
import { toFormParts } from "../../utils/format";
import type { Reminder, RescheduleInput } from "../../types/reminder";
import styles from "./ReminderRowActions.module.css";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

interface Preset {
  label: string;
  deltaMs: number;
}

const TIMED_PRESETS: Preset[] = [
  { label: "+1 hora", deltaMs: HOUR },
  { label: "+3 horas", deltaMs: 3 * HOUR },
  { label: "+1 dia", deltaMs: DAY },
  { label: "+1 semana", deltaMs: 7 * DAY },
];

const ALL_DAY_PRESETS: Preset[] = [
  { label: "+1 dia", deltaMs: DAY },
  { label: "+1 semana", deltaMs: 7 * DAY },
];

interface ReminderRowActionsProps {
  reminder: Reminder;
  now: number;
  onCheck: (id: string) => void;
  onReschedule: (id: string, input: RescheduleInput) => void;
  onCustom: (id: string) => void;
}

export function ReminderRowActions({
  reminder,
  now,
  onCheck,
  onReschedule,
  onCustom,
}: ReminderRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const presets = reminder.isAllDay ? ALL_DAY_PRESETS : TIMED_PRESETS;
  const base = Math.max(now, Date.parse(reminder.eventAt));
  const limit = reminder.nextOccurrenceAt ? Date.parse(reminder.nextOccurrenceAt) : null;

  const applyPreset = (deltaMs: number) => {
    const parts = toFormParts(new Date(base + deltaMs).toISOString());
    setOpen(false);
    onReschedule(reminder.id, {
      date: parts.date,
      time: reminder.isAllDay ? null : parts.time,
    });
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.btn}
        title="Concluir"
        aria-label="Concluir"
        onClick={() => onCheck(reminder.id)}
      >
        <CheckIcon className={styles.icon} />
      </button>
      <button
        type="button"
        className={`${styles.btn} ${open ? styles.btnActive : ""}`}
        title="Remarcar"
        aria-label="Remarcar"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ClockIcon className={styles.icon} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <span className={styles.menuLabel}>Remarcar para</span>
          {presets.map((preset) => {
            const disabled = limit != null && base + preset.deltaMs >= limit;
            return (
              <button
                key={preset.label}
                type="button"
                className={styles.menuItem}
                role="menuitem"
                disabled={disabled}
                title={disabled ? "Passa do próximo agendamento" : undefined}
                onClick={() => applyPreset(preset.deltaMs)}
              >
                {preset.label}
              </button>
            );
          })}
          <div className={styles.divider} />
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCustom(reminder.id);
            }}
          >
            Personalizado…
          </button>
        </div>
      )}
    </div>
  );
}
