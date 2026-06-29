import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useReminders } from "../../hooks/useReminders";
import { ReminderActionsSheet } from "../../components/ReminderActionsSheet/ReminderActionsSheet";
import { Timeline } from "../../components/Timeline/Timeline";
import { BellIcon, CalendarIcon } from "../../components/Sidebar/Sidebar.icons";
import { ReminderCalendar } from "../../components/ReminderCalendar/ReminderCalendar";
import { groupByDay, groupByMonth, splitAgenda, type TimelineItem } from "../../utils/agenda";
import { recurrenceLabel, remainingLabel, dayRemainingLabel } from "../../utils/format";
import { todayLabel } from "../../utils/dashboard";
import { formatDateKey } from "../../utils/dateUtils";
import { useMinuteTick } from "../../hooks/useMinuteTick";
import type { Reminder } from "../../types/reminder";
import styles from "./RemindersPage.module.css";

function toTimelineItem(reminder: Reminder, now: number): TimelineItem {
  const when = Date.parse(reminder.eventAt);
  const remaining = reminder.isAllDay ? dayRemainingLabel(when, now) : remainingLabel(when, now);
  return {
    id: reminder.id,
    kind: "reminder",
    title: reminder.title,
    when,
    detail: recurrenceLabel(reminder) ?? (reminder.isAllDay ? "Dia inteiro" : ""),
    hasTime: !reminder.isAllDay,
    subtitle: remaining?.text,
    subtitleTone: remaining?.overdue ? "danger" : undefined,
  };
}

const iconForBell = () => BellIcon;

export function RemindersPage() {
  const navigate = useNavigate();
  const { reminders, loading, error, reload, acknowledge, reschedule, cancel } = useReminders();

  const [selected, setSelected] = useState<Reminder | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const byId = useMemo(() => new Map(reminders.map((r) => [r.id, r])), [reminders]);

  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const reminder of reminders) {
      const key = formatDateKey(new Date(reminder.eventAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [reminders]);

  const selectedReminder = selected ? byId.get(selected.id) ?? selected : null;

  const now = useMinuteTick();

  const timeline = useMemo(() => {
    const items = reminders.map((r) => toTimelineItem(r, now)).sort((a, b) => a.when - b.when);
    const { week, later } = splitAgenda(items);
    return { weekGroups: groupByDay(week), laterGroups: groupByMonth(later) };
  }, [reminders, now]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.date}>{todayLabel()}</p>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.calendarButton}
            aria-label="Abrir calendário"
            onClick={() => setCalendarOpen(true)}
          >
            <CalendarIcon className={styles.calendarIcon} />
          </button>
          <Link to="/lembretes/novo" className={styles.newButton} aria-label="Novo lembrete">
            <span className={styles.newPlus} aria-hidden="true">+</span>
            <span className={styles.newLabel}>Novo lembrete</span>
          </Link>
        </div>
      </header>

      {loading && <p className={styles.muted}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && reminders.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nada por aqui ainda</p>
          <p className={styles.muted}>Crie seu primeiro lembrete e eu te aviso no Telegram.</p>
          <Link to="/lembretes/novo" className={styles.emptyButton}>
            + Novo lembrete
          </Link>
        </div>
      )}

      {!loading && !error && reminders.length > 0 && (
        <Timeline
          weekGroups={timeline.weekGroups}
          laterGroups={timeline.laterGroups}
          iconFor={iconForBell}
          onItemClick={(item) => setSelected(byId.get(item.id) ?? null)}
          onItemLongPress={(item) => navigate(`/lembretes/r/${item.id}`)}
          emptyMessage="Nenhum lembrete ativo agendado."
        />
      )}

      {selectedReminder && (
        <ReminderActionsSheet
          reminder={selectedReminder}
          now={now}
          onClose={() => setSelected(null)}
          onCheck={(id) => acknowledge(id).catch(() => undefined)}
          onReschedule={(id, input) =>
            reschedule(id, input).catch((err) =>
              window.alert(err?.response?.data?.error ?? "Não foi possível remarcar.")
            )
          }
          onCustom={(id) => navigate(`/lembretes/r/${id}?action=reschedule`)}
          onCancel={(id) => cancel(id).catch(() => undefined)}
        />
      )}

      {calendarOpen && (
        <ReminderCalendar countByDay={countByDay} onClose={() => setCalendarOpen(false)} />
      )}

      <Outlet context={{ reload }} />
    </div>
  );
}
