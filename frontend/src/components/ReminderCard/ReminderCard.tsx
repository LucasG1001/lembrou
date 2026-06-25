import { Link } from "react-router-dom";
import type { Reminder } from "../../types/reminder";
import { formatEventAt, formatDateTime, recurrenceLabel, STATUS_LABEL } from "../../utils/format";
import styles from "./ReminderCard.module.css";

interface Props {
  reminder: Reminder;
  onAcknowledge: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReminderCard({ reminder, onAcknowledge, onCancel, onDelete }: Props) {
  const recurrence = recurrenceLabel(reminder);
  const isActive = reminder.status === "active";

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{reminder.title}</h3>
          {reminder.notes && <p className={styles.notes}>{reminder.notes}</p>}
        </div>
        <span className={`${styles.badge} ${styles[reminder.status]}`}>{STATUS_LABEL[reminder.status]}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          {reminder.isAllDay ? "📅" : "🕒"} {formatEventAt(reminder)}
        </span>
        {reminder.isAllDay && <span className={styles.tag}>Dia inteiro</span>}
        {recurrence && <span className={styles.tag}>🔁 {recurrence}</span>}
      </div>

      {isActive && (
        <div className={styles.nextLine}>
          Próximo aviso: <strong>{formatDateTime(reminder.nextNotifyAt)}</strong>
          {!reminder.isAllDay && (
            <span className={styles.count}>
              {reminder.notifyCount}/{reminder.maxNotify} avisos
            </span>
          )}
        </div>
      )}

      <div className={styles.actions}>
        {isActive && (
          <>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => onAcknowledge(reminder.id)}>
              ✅ {reminder.isAllDay ? "Já resolvi" : "Já estou no evento"}
            </button>
            <Link to={`/lembretes/r/${reminder.id}`} className={`${styles.btn} ${styles.ghost}`}>
              Editar
            </Link>
            <button className={`${styles.btn} ${styles.ghost}`} onClick={() => onCancel(reminder.id)}>
              Cancelar
            </button>
          </>
        )}
        <button className={`${styles.btn} ${styles.danger}`} onClick={() => onDelete(reminder.id)}>
          Excluir
        </button>
      </div>
    </article>
  );
}
