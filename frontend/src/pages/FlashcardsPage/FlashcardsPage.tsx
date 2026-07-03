import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFlashcards } from "../../hooks/useFlashcards";
import { FlashcardReview } from "../../components/FlashcardReview/FlashcardReview";
import { FlashcardList } from "../../components/FlashcardList/FlashcardList";
import { FlashcardForm } from "../../components/FlashcardForm/FlashcardForm";
import { fetchFlashcard } from "../../services/flashcardService";
import { apiErrorMessage } from "../../utils/apiError";
import type { Flashcard, FlashcardFormData } from "../../types/flashcard";
import styles from "./FlashcardsPage.module.css";

export function FlashcardsPage() {
  const { cards, loading, error, dueCount, createCard, updateCard, deleteCard, applyReview } =
    useFlashcards();

  const [tab, setTab] = useState<"review" | "all">("review");
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const formMode: "create" | "edit" | null = editing
    ? "edit"
    : searchParams.get("novo") === "1"
      ? "create"
      : null;

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormError(null);
    setSearchParams({ novo: "1" });
  }, [setSearchParams]);

  const closeForm = useCallback(() => {
    setEditing(null);
    setFormError(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSave = useCallback(
    (data: FlashcardFormData) => {
      const action =
        formMode === "edit" && editing ? updateCard(editing.id, data) : createCard(data);
      setFormError(null);
      action
        .then(closeForm)
        .catch((err) => setFormError(apiErrorMessage(err, "Não foi possível salvar o flashcard.")));
    },
    [formMode, editing, updateCard, createCard, closeForm]
  );

  const handleEdit = useCallback((id: string) => {
    setFormError(null);
    fetchFlashcard(id)
      .then(setEditing)
      .catch((err) =>
        window.alert(apiErrorMessage(err, "Não foi possível carregar o flashcard."))
      );
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteCard(id).catch((err) =>
        window.alert(apiErrorMessage(err, "Não foi possível excluir o flashcard."))
      );
    },
    [deleteCard]
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Flashcards</h1>
        <button className={styles.newButton} aria-label="Novo flashcard" onClick={openCreate}>
          <span className={styles.newPlus} aria-hidden="true">+</span>
          <span className={styles.newLabel}>Novo flashcard</span>
        </button>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "review"}
          className={`${styles.tab} ${tab === "review" ? styles.tabActive : ""}`}
          onClick={() => setTab("review")}
        >
          Revisar
          {dueCount > 0 && <span className={styles.badge}>{dueCount}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
          onClick={() => setTab("all")}
        >
          Todas
        </button>
      </div>

      {loading && <p className={styles.muted}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        tab === "review" ? (
          <FlashcardReview onReview={applyReview} />
        ) : (
          <FlashcardList cards={cards} onEdit={handleEdit} onDelete={handleDelete} />
        )
      )}

      {formMode && (
        <FlashcardForm
          mode={formMode}
          initialData={formMode === "edit" && editing ? editing : undefined}
          error={formError}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
