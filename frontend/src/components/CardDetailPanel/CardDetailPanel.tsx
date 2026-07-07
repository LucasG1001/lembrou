import { useState } from "react";
import type { Card, CardPatch, ChecklistItem } from "../../types/project";
import { useDismiss } from "../../hooks/useDismiss";
import { ImagePasteArea } from "../ImagePasteArea/ImagePasteArea";
import styles from "./CardDetailPanel.module.css";

interface CardDetailPanelProps {
  card: Card;
  onSave: (patch: CardPatch) => void;
  onDelete: (card: Card) => void;
  onClose: () => void;
}

export function CardDetailPanel({ card, onSave, onDelete, onClose }: CardDetailPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [images, setImages] = useState<string[]>(card.images);
  const [done, setDone] = useState(card.done);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [newItem, setNewItem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useDismiss(onClose);

  const checkedCount = checklist.filter((item) => item.done).length;

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    setChecklist([...checklist, { text, done: false }]);
    setNewItem("");
  }

  function toggleItem(index: number) {
    setChecklist(checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item)));
  }

  function updateItemText(index: number, text: string) {
    setChecklist(checklist.map((item, i) => (i === index ? { ...item, text } : item)));
  }

  function removeItem(index: number) {
    setChecklist(checklist.filter((_, i) => i !== index));
  }

  function handleSave() {
    onSave({
      title: title.trim() || card.title,
      description,
      images,
      done,
      checklist: checklist.map((item) => ({ ...item, text: item.text.trim() })).filter((item) => item.text),
    });
    onClose();
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(card);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-label={`Detalhes de ${card.title}`}>
        <div className={styles.header}>
          <label className={styles.doneToggle}>
            <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
            Concluído
          </label>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar painel">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.label} htmlFor="card-title">
            Título
          </label>
          <input
            id="card-title"
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            placeholder="Título do cartão"
          />

          <ImagePasteArea
            id="card-description"
            label="Descrição"
            value={description}
            onChange={setDescription}
            images={images}
            onImagesChange={setImages}
            placeholder="Detalhes, links, passos… (cole ou adicione imagens)"
          />

          <div className={styles.checklist}>
            <div className={styles.checklistHead}>
              <span className={styles.label}>Checklist</span>
              {checklist.length > 0 && (
                <span className={styles.checklistCount}>
                  {checkedCount}/{checklist.length}
                </span>
              )}
            </div>

            {checklist.map((item, index) => (
              <div key={index} className={styles.checkItem}>
                <input
                  type="checkbox"
                  className={styles.checkBox}
                  checked={item.done}
                  onChange={() => toggleItem(index)}
                />
                <input
                  type="text"
                  className={`${styles.checkText} ${item.done ? styles.checkTextDone : ""}`}
                  value={item.text}
                  onChange={(e) => updateItemText(index, e.target.value)}
                  maxLength={500}
                />
                <button
                  type="button"
                  className={styles.checkRemove}
                  onClick={() => removeItem(index)}
                  aria-label="Remover item"
                >
                  ×
                </button>
              </div>
            ))}

            <div className={styles.checkAdd}>
              <input
                type="text"
                className={styles.checkAddInput}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="Adicionar item…"
                maxLength={500}
              />
              <button type="button" className={styles.checkAddButton} onClick={addItem}>
                ＋
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.saveButton} onClick={handleSave}>
              Salvar
            </button>
            <button
              type="button"
              className={`${styles.deleteButton} ${confirmDelete ? styles.deleteConfirm : ""}`}
              onClick={handleDeleteClick}
            >
              {confirmDelete ? "Confirmar exclusão?" : "Excluir cartão"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
