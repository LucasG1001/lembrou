import type { Card } from "../../types/project";
import { InlineTextEdit } from "../InlineTextEdit/InlineTextEdit";
import styles from "./BoardCard.module.css";

interface BoardCardProps {
  card: Card;
  editing: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onPointerDown: (e: React.PointerEvent, card: Card) => void;
  onToggleDone: (card: Card) => void;
  onCommitTitle: (card: Card, title: string) => void;
  onCancelEdit: () => void;
  onDelete: (card: Card) => void;
}

export function BoardCard({
  card,
  editing,
  dragging,
  dropTarget,
  onPointerDown,
  onToggleDone,
  onCommitTitle,
  onCancelEdit,
  onDelete,
}: BoardCardProps) {
  return (
    <div
      data-card-id={card.id}
      className={`${styles.card} ${card.done ? styles.done : ""} ${dragging ? styles.dragging : ""} ${
        editing ? styles.editing : ""
      } ${dropTarget ? styles.dropTarget : ""}`}
      onPointerDown={(e) => onPointerDown(e, card)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={`${styles.check} ${card.done ? styles.checkDone : ""}`}
        aria-pressed={card.done}
        aria-label={card.done ? "Desmarcar como feito" : "Marcar como feito"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onToggleDone(card)}
      >
        <svg viewBox="0 0 24 24" className={styles.checkIcon} aria-hidden="true">
          <path
            d="m5 12 5 5 9-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {editing ? (
        <InlineTextEdit
          initial={card.title}
          multiline
          className={styles.titleInput}
          onCommit={(title) => onCommitTitle(card, title)}
          onCancel={onCancelEdit}
        />
      ) : (
        <span className={styles.title}>{card.title}</span>
      )}

      {!editing && (
        <button
          type="button"
          className={styles.delete}
          aria-label="Excluir cartão"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(card)}
        >
          ×
        </button>
      )}
    </div>
  );
}
