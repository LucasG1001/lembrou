import { useState } from "react";
import type { FlashcardCategory, FlashcardCategoryFormData } from "../../types/flashcardCategory";
import { useDismiss } from "../../hooks/useDismiss";
import { CATEGORY_COLORS, tints } from "../../utils/flashcardPalette";
import { apiErrorMessage } from "../../utils/apiError";
import styles from "./FlashcardCategoryModal.module.css";

interface FlashcardCategoryModalProps {
  categories: FlashcardCategory[];
  onCreate: (data: FlashcardCategoryFormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onClose: () => void;
}

export function FlashcardCategoryModal({
  categories,
  onCreate,
  onDelete,
  onClose,
}: FlashcardCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useDismiss(onClose);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({ name: trimmed, color });
      setName("");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category: FlashcardCategory) {
    if (!window.confirm(`Excluir a categoria "${category.name}"? Os cartões ficarão sem categoria.`)) {
      return;
    }
    setError(null);
    try {
      await onDelete(category.id);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível excluir a categoria."));
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Categorias</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.list}>
          {categories.length === 0 ? (
            <p className={styles.muted}>Nenhuma categoria ainda.</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className={styles.item}>
                <span className={styles.dot} style={{ background: tints(c.color).dot }} />
                <span className={styles.itemName}>{c.name}</span>
                <button
                  type="button"
                  className={styles.itemDelete}
                  onClick={() => handleDelete(c)}
                  aria-label={`Excluir ${c.name}`}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.label}>Nova categoria</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Nome da categoria"
            maxLength={60}
            autoFocus
          />
          <div className={styles.swatches}>
            {CATEGORY_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`${styles.swatch} ${color === hex ? styles.swatchActive : ""}`}
                style={{ background: hex }}
                onClick={() => setColor(hex)}
                aria-label={`Cor ${hex}`}
                aria-pressed={color === hex}
              />
            ))}
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.addButton} disabled={!name.trim() || busy}>
            Adicionar categoria
          </button>
        </form>
      </div>
    </div>
  );
}
