import { useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useReminders } from "../../hooks/useReminders";
import { ReminderCard } from "../../components/ReminderCard/ReminderCard";
import { Timeline } from "../../components/Timeline/Timeline";
import { BellIcon } from "../../components/Sidebar/Sidebar.icons";
import { groupByDay, groupByMonth, splitAgenda, type TimelineItem } from "../../utils/agenda";
import { recurrenceLabel } from "../../utils/format";
import type { Reminder, ReminderStatus } from "../../types/reminder";
import styles from "./RemindersPage.module.css";

const TABS: { value: ReminderStatus; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "done", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function toTimelineItem(reminder: Reminder): TimelineItem {
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
  const { reminders, status, setStatus, loading, error, reload, remove, acknowledge, cancel } =
    useReminders();

  const handleDelete = (id: string) => {
    if (window.confirm("Excluir este lembrete de vez?")) {
      remove(id).catch(() => undefined);
    }
  };

  const timeline = useMemo(() => {
    const items = reminders.map(toTimelineItem).sort((a, b) => a.when - b.when);
    const { week, later } = splitAgenda(items);
    return { weekGroups: groupByDay(week), laterGroups: groupByMonth(later) };
  }, [reminders]);

  const isActiveTab = status === "active";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Lembretes</h1>
        <Link to="/lembretes/novo" className={styles.newButton}>
          + Novo lembrete
        </Link>
      </header>

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
          onItemClick={(item) => navigate(`/lembretes/r/${item.id}`)}
          emptyMessage="Nenhum lembrete ativo agendado."
        />
      )}

      {!loading && !error && reminders.length > 0 && !isActiveTab && (
        <div className={styles.list}>
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onAcknowledge={(id) => acknowledge(id).catch(() => undefined)}
              onCancel={(id) => cancel(id).catch(() => undefined)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Outlet context={{ reload }} />
    </div>
  );
}
