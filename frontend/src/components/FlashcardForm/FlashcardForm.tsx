import { useState } from "react";
import type { Flashcard, FlashcardFormData } from "../../types/flashcard";
import { Modal } from "../Modal/Modal";
import { ImagePasteArea } from "../ImagePasteArea/ImagePasteArea";
import styles from "./FlashcardForm.module.css";

interface FlashcardFormProps {
  mode: "create" | "edit";
  initialData?: Flashcard;
  error?: string | null;
  onSave: (data: FlashcardFormData) => void;
  onClose: () => void;
}

export function FlashcardForm({ mode, initialData, error, onSave, onClose }: FlashcardFormProps) {
  const [question, setQuestion] = useState(initialData?.question ?? "");
  const [answer, setAnswer] = useState(initialData?.answer ?? "");
  const [questionImages, setQuestionImages] = useState<string[]>(initialData?.questionImages ?? []);
  const [answerImages, setAnswerImages] = useState<string[]>(initialData?.answerImages ?? []);
  const [tag, setTag] = useState(initialData?.tag ?? "");

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
  const title = mode === "create" ? "Novo flashcard" : "Editar flashcard";

  return (
    <Modal title={title} onClose={onClose} onSubmit={handleSubmit} submitDisabled={!isValid}>
      <ImagePasteArea
        id="flashcard-question"
        label="Pergunta"
        value={question}
        onChange={setQuestion}
        images={questionImages}
        onImagesChange={setQuestionImages}
        placeholder="O que você quer memorizar?"
        autoFocus
      />

      <ImagePasteArea
        id="flashcard-answer"
        label="Resposta"
        value={answer}
        onChange={setAnswer}
        images={answerImages}
        onImagesChange={setAnswerImages}
        placeholder="A resposta que deve vir à mente"
      />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="flashcard-tag">
          Tag (opcional)
        </label>
        <input
          id="flashcard-tag"
          type="text"
          className={styles.input}
          value={tag}
          onChange={(e) => setTag(e.target.value.slice(0, 100))}
          placeholder="ex: Inglês"
          maxLength={100}
          autoComplete="off"
        />
      </div>

      {error && <p className={styles.formError}>{error}</p>}
    </Modal>
  );
}
