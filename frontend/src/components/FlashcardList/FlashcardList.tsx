import { useMemo, useState } from "react";
import type { FlashcardSummary } from "../../types/flashcard";
import { formatNextReview } from "../../utils/flashcardUtils";
import styles from "./FlashcardList.module.css";

interface FlashcardListProps {
  cards: FlashcardSummary[];
  onSelect: (id: string) => void;
}

type Filter = { kind: "all" } | { kind: "none" } | { kind: "tag"; value: string };

export function FlashcardList({ cards, onSelect }: FlashcardListProps) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });

  const tags = useMemo(() => {
    const unique = new Set<string>();
    for (const card of cards) {
      if (card.tag) unique.add(card.tag);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [cards]);

  const hasUntagged = useMemo(() => cards.some((c) => !c.tag), [cards]);

  const visible = useMemo(() => {
    const filtered = cards.filter((c) => {
      if (filter.kind === "all") return true;
      if (filter.kind === "none") return !c.tag;
      return c.tag === filter.value;
    });
    return [...filtered].sort(
      (a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
    );
  }, [cards, filter]);

  if (cards.length === 0) {
    return <p className={styles.muted}>Nenhum flashcard cadastrado ainda.</p>;
  }

  return (
    <div className={styles.wrapper}>
      {(tags.length > 0 || hasUntagged) && (
        <div className={styles.filters} role="group" aria-label="Filtrar por tag">
          <button
            type="button"
            className={`${styles.filterChip} ${filter.kind === "all" ? styles.filterChipActive : ""}`}
            onClick={() => setFilter({ kind: "all" })}
          >
            Todas
          </button>
          {hasUntagged && (
            <button
              type="button"
              className={`${styles.filterChip} ${filter.kind === "none" ? styles.filterChipActive : ""}`}
              onClick={() => setFilter({ kind: "none" })}
            >
              Sem tag
            </button>
          )}
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.filterChip} ${
                filter.kind === "tag" && filter.value === tag ? styles.filterChipActive : ""
              }`}
              onClick={() => setFilter({ kind: "tag", value: tag })}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <span className={styles.count}>
        {visible.length} {visible.length === 1 ? "flashcard" : "flashcards"}
      </span>

      <div className={styles.list}>
        {visible.map((card) => {
          const next = formatNextReview(card.nextReviewAt);
          return (
            <div
              key={card.id}
              className={styles.row}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(card.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(card.id);
                }
              }}
            >
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
          );
        })}
      </div>
    </div>
  );
}
