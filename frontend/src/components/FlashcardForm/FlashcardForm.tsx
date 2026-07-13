import { useState } from "react";
import type { Flashcard, FlashcardFormData } from "../../types/flashcard";
import type { FlashcardCategory } from "../../types/flashcardCategory";
import { ImagePasteArea } from "../ImagePasteArea/ImagePasteArea";
import { ConfirmButton } from "../ConfirmButton/ConfirmButton";
import { useDismiss } from "../../hooks/useDismiss";
import { NEUTRAL_TINTS, tints } from "../../utils/flashcardPalette";
import styles from "./FlashcardForm.module.css";

interface FlashcardFormProps {
  initialData?: Flashcard;
  categories: FlashcardCategory[];
  error?: string | null;
  onSave: (data: FlashcardFormData) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function FlashcardForm({
  initialData,
  categories,
  error,
  onSave,
  onClose,
  onDelete,
}: FlashcardFormProps) {
  const [question, setQuestion] = useState(initialData?.question ?? "");
  const [answer, setAnswer] = useState(initialData?.answer ?? "");
  const [questionImages, setQuestionImages] = useState<string[]>(initialData?.questionImages ?? []);
  const [answerImages, setAnswerImages] = useState<string[]>(initialData?.answerImages ?? []);
  const [categoryId, setCategoryId] = useState<string | null>(
    initialData?.categoryId ?? categories[0]?.id ?? null
  );

  useDismiss(onClose);

  const isValid = question.trim().length > 0 && answer.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      question: question.trim(),
      answer: answer.trim(),
      questionImages,
      answerImages,
      categoryId,
    });
  }

  const catOptions: { id: string | null; label: string; color: string | null }[] = [
    ...categories.map((c) => ({ id: c.id as string | null, label: c.name, color: c.color })),
    { id: null, label: "Sem categoria", color: null },
  ];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <form className={styles.drawer} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialData ? "Editar cartão" : "Novo cartão"}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Categoria</label>
            <div className={styles.catPills}>
              {catOptions.map((opt) => {
                const active = opt.id === categoryId;
                const t = opt.color ? tints(opt.color) : NEUTRAL_TINTS;
                return (
                  <button
                    key={opt.id ?? "none"}
                    type="button"
                    className={`${styles.catPill} ${active ? styles.catPillActive : ""}`}
                    onClick={() => setCategoryId(opt.id)}
                    style={active ? { background: t.bg, color: t.fg, borderColor: t.border } : undefined}
                  >
                    {opt.color && <span className={styles.dot} style={{ background: t.dot }} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ImagePasteArea
            id="flashcard-question"
            label="Frente (pergunta)"
            value={question}
            onChange={setQuestion}
            images={questionImages}
            onImagesChange={setQuestionImages}
            autoFocus
          />

          <ImagePasteArea
            id="flashcard-answer"
            label="Verso (resposta)"
            value={answer}
            onChange={setAnswer}
            images={answerImages}
            onImagesChange={setAnswerImages}
          />

          <div className={styles.field}>
            <label className={styles.label}>Pré-visualização</label>
            <div className={styles.preview}>
              <div className={styles.previewFront}>
                <span className={styles.previewKind}>FRENTE</span>
                <p className={styles.previewText}>
                  {question.trim() || "A frente do cartão aparece aqui…"}
                </p>
              </div>
              <div className={styles.previewBack}>
                <span className={styles.previewKindBack}>VERSO</span>
                <p className={styles.previewText}>
                  {answer.trim() || "O verso (resposta) aparece aqui…"}
                </p>
              </div>
            </div>
          </div>

          {error && <p className={styles.formError}>{error}</p>}
        </div>

        <div className={styles.footer}>
          {initialData && onDelete ? (
            <ConfirmButton
              className={styles.deleteButton}
              confirmClassName={styles.deleteConfirm}
              idleLabel="Excluir"
              confirmLabel="Confirmar?"
              onConfirm={onDelete}
            />
          ) : (
            <span />
          )}
          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={!isValid}>
              {initialData ? "Salvar alterações" : "Criar cartão"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
