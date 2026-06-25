import { useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useReminders } from "../../hooks/useReminders";
import { ReminderRowActions } from "../../components/ReminderRowActions/ReminderRowActions";
import { ReminderHistoryActions } from "../../components/ReminderHistoryActions/ReminderHistoryActions";
import { Timeline } from "../../components/Timeline/Timeline";
import { BellIcon } from "../../components/Sidebar/Sidebar.icons";
import { groupByDay, groupByMonth, splitAgenda, type TimelineItem } from "../../utils/agenda";
import { recurrenceLabel, remainingLabel } from "../../utils/format";
import { useMinuteTick } from "../../hooks/useMinuteTick";
import type { Reminder, ReminderStatus } from "../../types/reminder";
import styles from "./RemindersPage.module.css";

const TABS: { value: ReminderStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "done", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function toTimelineItem(reminder: Reminder, now: number): TimelineItem {
  const when = Date.parse(reminder.eventAt);
  const remaining = reminder.isAllDay ? null : remainingLabel(when, now);
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

function toHistoryItem(reminder: Reminder): TimelineItem {
  return {
    id: reminder.id,
    kind: "reminder",
    title: reminder.title,
    when: Date.parse(reminder.eventAt),
    detail: recurrenceLabel(reminder) ?? (reminder.isAllDay ? "Dia inteiro" : ""),
    hasTime: !reminder.isAllDay,
  };
}

export function RemindersPage() {
  const navigate = useNavigate();
  const {
    reminders,
    status,
    setStatus,
    loading,
    error,
    reload,
    remove,
    acknowledge,
    reschedule,
  } = useReminders();

  const byId = useMemo(() => new Map(reminders.map((r) => [r.id, r])), [reminders]);

  const handleDelete = (id: string) => {
    if (window.confirm("Excluir este lembrete de vez?")) {
      remove(id).catch(() => undefined);
    }
  };

  const now = useMinuteTick();

  const timeline = useMemo(() => {
    const items = reminders.map((r) => toTimelineItem(r, now)).sort((a, b) => a.when - b.when);
    const { week, later } = splitAgenda(items);
    return { weekGroups: groupByDay(week), laterGroups: groupByMonth(later) };
  }, [reminders, now]);

  const historyGroups = useMemo(() => {
    const items = reminders.map(toHistoryItem).sort((a, b) => b.when - a.when);
    return groupByMonth(items);
  }, [reminders]);

  const isActiveTab = status === "active";

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${status === tab.value ? styles.tabActive : ""}`}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link to="/lembretes/novo" className={styles.newButton}>
          + Novo lembrete
        </Link>
      </div>

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

      {!loading && !error && reminders.length > 0 && isActiveTab && (
        <Timeline
          weekGroups={timeline.weekGroups}
          laterGroups={timeline.laterGroups}
          iconFor={() => BellIcon}
          onItemClick={(item: TimelineItem) => navigate(`/lembretes/r/${item.id}`)}
          renderAction={(item: TimelineItem) => {
            const reminder = byId.get(item.id);
            if (!reminder) return null;
            return (
              <ReminderRowActions
                reminder={reminder}
                now={now}
                onCheck={(id) => acknowledge(id).catch(() => undefined)}
                onReschedule={(id, input) => reschedule(id, input).catch(() => undefined)}
                onCustom={(id) => navigate(`/lembretes/r/${id}?action=reschedule`)}
              />
            );
          }}
          emptyMessage="Nenhum lembrete ativo agendado."
        />
      )}

      {!loading && !error && reminders.length > 0 && !isActiveTab && (
        <Timeline
          weekGroups={[]}
          laterGroups={historyGroups}
          laterTitle={null}
          iconFor={() => BellIcon}
          onItemClick={(item: TimelineItem) => navigate(`/lembretes/r/${item.id}`)}
          renderAction={(item: TimelineItem) => (
            <ReminderHistoryActions id={item.id} onDelete={handleDelete} />
          )}
          emptyMessage={
            status === "done" ? "Nenhum lembrete concluído." : "Nenhum lembrete cancelado."
          }
        />
      )}

      <Outlet context={{ reload }} />
    </div>
  );
}
