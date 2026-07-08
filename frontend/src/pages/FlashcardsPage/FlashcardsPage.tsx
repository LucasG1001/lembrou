import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFlashcards } from "../../hooks/useFlashcards";
import { useFlashcardCategories } from "../../hooks/useFlashcardCategories";
import { FlashcardReview } from "../../components/FlashcardReview/FlashcardReview";
import { FlashcardList } from "../../components/FlashcardList/FlashcardList";
import { FlashcardForm } from "../../components/FlashcardForm/FlashcardForm";
import { FlashcardCategoryModal } from "../../components/FlashcardCategoryModal/FlashcardCategoryModal";
import { fetchFlashcard } from "../../services/flashcardService";
import { apiErrorMessage } from "../../utils/apiError";
import type { Flashcard, FlashcardFormData } from "../../types/flashcard";
import styles from "./FlashcardsPage.module.css";

type Mode = "study" | "manage";

export function FlashcardsPage() {
  const {
    cards,
    loading,
    error,
    dueCount,
    createCard,
    updateCard,
    deleteCard,
    bulkDelete,
    bulkMove,
    applyReview,
  } = useFlashcards();
  const {
    categories,
    createCategory,
    deleteCategory,
  } = useFlashcardCategories();

  const [mode, setMode] = useState<Mode>("study");
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const formMode: "create" | "edit" | null = editing
    ? "edit"
    : searchParams.get("novo") === "1"
      ? "create"
      : null;

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormError(null);
    setMode("manage");
    setSearchParams({ novo: "1" });
  }, [setSearchParams]);

  const closeForm = useCallback(() => {
    setEditing(null);
    setFormError(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSave = useCallback(
    (data: FlashcardFormData) => {
      const isEdit = formMode === "edit" && editing;
      const action = isEdit ? updateCard(editing.id, data) : createCard(data);
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
      .catch((err) => window.alert(apiErrorMessage(err, "Não foi possível carregar o flashcard.")));
  }, []);

  const handleDelete = useCallback(() => {
    if (!editing) return;
    deleteCard(editing.id)
      .then(closeForm)
      .catch((err) => setFormError(apiErrorMessage(err, "Não foi possível excluir o flashcard.")));
  }, [editing, deleteCard, closeForm]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "study"}
            className={`${styles.tab} ${mode === "study" ? styles.tabActive : ""}`}
            onClick={() => setMode("study")}
          >
            Estudar
            {dueCount > 0 && <span className={styles.badge}>{dueCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manage"}
            className={`${styles.tab} ${mode === "manage" ? styles.tabActive : ""}`}
            onClick={() => setMode("manage")}
          >
            Gerenciar
          </button>
        </div>

        <button className={styles.newButton} aria-label="Novo flashcard" onClick={openCreate}>
          <span className={styles.newPlus} aria-hidden="true">+</span>
          <span className={styles.newLabel}>Novo cartão</span>
        </button>
      </div>

      {loading && <p className={styles.muted}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        mode === "study" ? (
          <FlashcardReview categories={categories} onReview={applyReview} />
        ) : (
          <FlashcardList
            cards={cards}
            categories={categories}
            onEdit={handleEdit}
            onDelete={bulkDelete}
            onMove={bulkMove}
            onManageCategories={() => setCategoryModalOpen(true)}
          />
        )
      )}

      {formMode && (
        <FlashcardForm
          initialData={formMode === "edit" && editing ? editing : undefined}
          categories={categories}
          error={formError}
          onSave={handleSave}
          onClose={closeForm}
          onDelete={formMode === "edit" && editing ? handleDelete : undefined}
        />
      )}

      {categoryModalOpen && (
        <FlashcardCategoryModal
          categories={categories}
          onCreate={createCategory}
          onDelete={deleteCategory}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}
