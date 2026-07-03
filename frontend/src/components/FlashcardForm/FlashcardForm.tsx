import { useCallback, useRef, useState } from "react";
import type { Flashcard, FlashcardFormData } from "../../types/flashcard";
import { Modal } from "../Modal/Modal";
import { ImagePasteArea } from "../ImagePasteArea/ImagePasteArea";
import styles from "./FlashcardForm.module.css";

interface FlashcardFormProps {
  initialData?: Flashcard;
  existingTags?: string[];
  error?: string | null;
  onSave: (data: FlashcardFormData) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function FlashcardForm({
  initialData,
  existingTags = [],
  error,
  onSave,
  onClose,
  onDelete,
}: FlashcardFormProps) {
  const [question, setQuestion] = useState(initialData?.question ?? "");
  const [answer, setAnswer] = useState(initialData?.answer ?? "");
  const [questionImages, setQuestionImages] = useState<string[]>(initialData?.questionImages ?? []);
  const [answerImages, setAnswerImages] = useState<string[]>(initialData?.answerImages ?? []);
  const [tag, setTag] = useState(initialData?.tag ?? "");
  const [tagFocused, setTagFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const positionMenu = useCallback((menu: HTMLUListElement | null) => {
    if (!menu || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.width = `${rect.width}px`;
  }, []);

  const suggestions = existingTags.filter((t) => {
    const query = tag.trim().toLowerCase();
    return t.toLowerCase() !== query && (query === "" || t.toLowerCase().includes(query));
  });
  const showSuggestions = tagFocused && suggestions.length > 0;

  function handleSubmit() {
    onSave({
      question: question.trim(),
      answer: answer.trim(),
      questionImages,
      answerImages,
      tag: tag.trim() || null,
    });
  }

  const isValid = question.trim().length > 0 && answer.trim().length > 0;

  const deleteAction =
    initialData && onDelete ? (
      <button
        type="button"
        className={`${styles.deleteButton} ${confirmDelete ? styles.deleteConfirm : ""}`}
        onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
        onBlur={() => setConfirmDelete(false)}
      >
        {confirmDelete ? "Confirmar?" : "Excluir"}
      </button>
    ) : undefined;

  return (
    <Modal
      title=""
      hideClose
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={!isValid}
      footerStart={deleteAction}
    >
      <ImagePasteArea
        id="flashcard-question"
        label="Pergunta"
        value={question}
        onChange={setQuestion}
        images={questionImages}
        onImagesChange={setQuestionImages}
        autoFocus
      />

      <ImagePasteArea
        id="flashcard-answer"
        label="Resposta"
        value={answer}
        onChange={setAnswer}
        images={answerImages}
        onImagesChange={setAnswerImages}
      />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="flashcard-tag">
          Tag (opcional)
        </label>
        <div className={styles.tagWrapper}>
          <input
            id="flashcard-tag"
            ref={inputRef}
            type="text"
            className={styles.input}
            value={tag}
            onChange={(e) => setTag(e.target.value.slice(0, 100))}
            onFocus={() => setTagFocused(true)}
            onBlur={() => setTagFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setTagFocused(false);
            }}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore
          />
          {showSuggestions && (
            <ul className={styles.suggestions} ref={positionMenu}>
              {suggestions.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTag(t);
                      setTagFocused(false);
                    }}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className={styles.formError}>{error}</p>}
    </Modal>
  );
}
