import { useMemo, useState } from "react";
import type { FlashcardSummary } from "../../types/flashcard";
import { formatNextReview } from "../../utils/flashcardUtils";
import styles from "./FlashcardList.module.css";

interface FlashcardListProps {
  cards: FlashcardSummary[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FlashcardList({ cards, onEdit, onDelete }: FlashcardListProps) {
  const [tagFilter, setTagFilter] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const tags = useMemo(() => {
    const unique = new Set<string>();
    for (const card of cards) {
      if (card.tag) unique.add(card.tag);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [cards]);

  const visible = useMemo(() => {
    const filtered = tagFilter ? cards.filter((c) => c.tag === tagFilter) : cards;
    return [...filtered].sort(
      (a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
    );
  }, [cards, tagFilter]);

  function handleDeleteClick(id: string) {
    if (confirmingId === id) {
      setConfirmingId(null);
      onDelete(id);
    } else {
      setConfirmingId(id);
    }
  }

  if (cards.length === 0) {
    return <p className={styles.muted}>Nenhum flashcard cadastrado ainda.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {visible.length} {visible.length === 1 ? "flashcard" : "flashcards"}
        </span>
        {tags.length > 0 && (
          <select
            className={styles.tagFilter}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filtrar por tag"
          >
            <option value="">Todas as tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.list}>
        {visible.map((card) => {
          const next = formatNextReview(card.nextReviewAt);
          return (
            <div key={card.id} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.question}>{card.question}</p>
                <div className={styles.meta}>
                  {card.tag && <span className={styles.tag}>{card.tag}</span>}
                  <span className={styles.interval}>
                    {card.repetitions === 0 ? "novo" : `${card.intervalDays}d`}
                  </span>
                  <span className={`${styles.next} ${next.overdue ? styles.nextOverdue : ""}`}>
                    {next.label}
                  </span>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => onEdit(card.id)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton} ${
                    confirmingId === card.id ? styles.deleteConfirm : ""
                  }`}
                  onClick={() => handleDeleteClick(card.id)}
                  onBlur={() => setConfirmingId(null)}
                >
                  {confirmingId === card.id ? "Confirmar?" : "Excluir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
