import { useEffect, useMemo, useState } from "react";
import type { Flashcard, Grade } from "../../types/flashcard";
import { fetchDueFlashcards } from "../../services/flashcardService";
import { apiErrorMessage } from "../../utils/apiError";
import styles from "./FlashcardReview.module.css";

interface FlashcardReviewProps {
  onReview: (id: string, grade: Grade) => Promise<Flashcard>;
}

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: "again", label: "Errei", className: "gradeAgain" },
  { grade: "hard", label: "Difícil", className: "gradeHard" },
  { grade: "good", label: "Bom", className: "gradeGood" },
  { grade: "easy", label: "Fácil", className: "gradeEasy" },
];

export function FlashcardReview({ onReview }: FlashcardReviewProps) {
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetchDueFlashcards()
      .then(setQueue)
      .catch(() => setError("Não foi possível carregar a sessão de revisão."))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const fresh = queue.filter((c) => c.repetitions === 0).length;
    return { fresh, review: queue.length - fresh };
  }, [queue]);

  const card = queue[0];

  async function handleGrade(grade: Grade) {
    if (!card || grading) return;
    setGrading(true);
    setError(null);
    try {
      const updated = await onReview(card.id, grade);
      setQueue((prev) => (grade === "again" ? [...prev.slice(1), updated] : prev.slice(1)));
      if (grade !== "again") setDone((d) => d + 1);
      setRevealed(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível registrar a revisão."));
    } finally {
      setGrading(false);
    }
  }

  if (loading) return <p className={styles.muted}>Carregando…</p>;

  if (!card) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>
          {done > 0 ? "Sessão concluída." : "Nenhum cartão para revisar hoje."}
        </p>
        <p className={styles.muted}>
          {done > 0
            ? `Você revisou ${done} ${done === 1 ? "cartão" : "cartões"}.`
            : "Volte mais tarde ou crie novos flashcards."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.session}>
      <div className={styles.counters}>
        <span className={`${styles.counter} ${styles.counterFresh}`}>{counts.fresh} novos</span>
        <span className={`${styles.counter} ${styles.counterReview}`}>{counts.review} a revisar</span>
        <span className={`${styles.counter} ${styles.counterDone}`}>{done} feitos</span>
      </div>

      <div className={styles.card}>
        {card.tag && <span className={styles.tag}>{card.tag}</span>}
        <p className={styles.question}>{card.question}</p>
        {card.questionImages.length > 0 && (
          <div className={styles.images}>
            {card.questionImages.map((src, index) => (
              <img key={index} src={src} alt={`Imagem da pergunta ${index + 1}`} className={styles.image} />
            ))}
          </div>
        )}

        {revealed && (
          <div className={styles.answerBlock}>
            <p className={styles.answer}>{card.answer}</p>
            {card.answerImages.length > 0 && (
              <div className={styles.images}>
                {card.answerImages.map((src, index) => (
                  <img key={index} src={src} alt={`Imagem da resposta ${index + 1}`} className={styles.image} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {revealed ? (
        <div className={styles.grades}>
          {GRADES.map(({ grade, label, className }) => (
            <button
              key={grade}
              type="button"
              className={`${styles.gradeButton} ${styles[className]}`}
              onClick={() => handleGrade(grade)}
              disabled={grading}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className={styles.revealButton} onClick={() => setRevealed(true)}>
          Mostrar resposta
        </button>
      )}
    </div>
  );
}
