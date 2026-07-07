import type { Card } from "../../types/project";
import styles from "./BoardCard.module.css";

interface BoardCardProps {
  card: Card;
  dragging: boolean;
  dropTarget: boolean;
  onPointerDown: (e: React.PointerEvent, card: Card) => void;
  onToggleDone: (card: Card) => void;
  onDelete: (card: Card) => void;
}

export function BoardCard({ card, dragging, dropTarget, onPointerDown, onToggleDone, onDelete }: BoardCardProps) {
  const hasDescription = card.description.trim().length > 0;
  const checklistTotal = card.checklist.length;
  const checklistDone = card.checklist.filter((item) => item.done).length;
  const hasMeta = hasDescription || card.images.length > 0 || checklistTotal > 0;

  return (
    <div
      data-card-id={card.id}
      className={`${styles.card} ${card.done ? styles.done : ""} ${dragging ? styles.dragging : ""} ${
        dropTarget ? styles.dropTarget : ""
      }`}
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

      <div className={styles.content}>
        <span className={styles.title}>{card.title}</span>
        {hasMeta && (
          <span className={styles.meta}>
            {hasDescription && (
              <span className={styles.metaItem} aria-label="Tem descrição" title="Tem descrição">
                📝
              </span>
            )}
            {card.images.length > 0 && (
              <span className={styles.metaItem} aria-label={`${card.images.length} imagem(ns)`}>
                🖼 {card.images.length}
              </span>
            )}
            {checklistTotal > 0 && (
              <span className={styles.metaItem} aria-label="Checklist">
                ☑ {checklistDone}/{checklistTotal}
              </span>
            )}
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.delete}
        aria-label="Excluir cartão"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(card)}
      >
        ×
      </button>
    </div>
  );
}
