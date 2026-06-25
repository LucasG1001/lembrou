import { TrashIcon } from "../Sidebar/Sidebar.icons";
import styles from "./ReminderHistoryActions.module.css";

interface ReminderHistoryActionsProps {
  id: string;
  onDelete: (id: string) => void;
}

export function ReminderHistoryActions({ id, onDelete }: ReminderHistoryActionsProps) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.btn}
        title="Excluir"
        aria-label="Excluir"
        onClick={() => onDelete(id)}
      >
        <TrashIcon className={styles.icon} />
      </button>
    </div>
  );
}
