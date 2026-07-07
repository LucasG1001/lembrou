import { useEffect, useRef, useState } from "react";
import type { BoardList, Card } from "../../types/project";
import { BoardCard } from "../BoardCard/BoardCard";
import { InlineTextEdit } from "../InlineTextEdit/InlineTextEdit";
import styles from "./BoardList.module.css";

interface AddCardComposerProps {
  onAdd: (title: string) => void;
  onClose: () => void;
}

function AddCardComposer({ onAdd, onClose }: AddCardComposerProps) {
  const [draft, setDraft] = useState("");
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const submit = (keepOpen: boolean) => {
    const title = draft.trim();
    if (title) onAdd(title);
    setDraft("");
    if (keepOpen) fieldRef.current?.focus();
    else onClose();
  };

  return (
    <div className={styles.composer}>
      <textarea
        ref={fieldRef}
        rows={1}
        value={draft}
        placeholder="Título do cartão"
        className={styles.composerField}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(true);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft("");
            onClose();
          }
        }}
        onBlur={() => submit(false)}
      />
    </div>
  );
}

interface BoardListColumnProps {
  list: BoardList;
  dragging: boolean;
  dragCardId: string | null;
  dropCardId: string | null;
  dropOnEmpty: boolean;
  listDropTarget: boolean;
  editingCardId: string | null;
  renaming: boolean;
  composerOpen: boolean;
  onHeaderPointerDown: (e: React.PointerEvent, listId: string) => void;
  onRenameCommit: (listId: string, name: string) => void;
  onRenameCancel: () => void;
  onDeleteList: (list: BoardList) => void;
  onOpenComposer: (listId: string) => void;
  onCloseComposer: () => void;
  onAddCard: (listId: string, title: string) => void;
  onCardPointerDown: (e: React.PointerEvent, card: Card) => void;
  onToggleDone: (card: Card) => void;
  onCommitCardTitle: (card: Card, title: string) => void;
  onCancelCardEdit: () => void;
  onDeleteCard: (card: Card) => void;
}

export function BoardListColumn({
  list,
  dragging,
  dragCardId,
  dropCardId,
  dropOnEmpty,
  listDropTarget,
  editingCardId,
  renaming,
  composerOpen,
  onHeaderPointerDown,
  onRenameCommit,
  onRenameCancel,
  onDeleteList,
  onOpenComposer,
  onCloseComposer,
  onAddCard,
  onCardPointerDown,
  onToggleDone,
  onCommitCardTitle,
  onCancelCardEdit,
  onDeleteCard,
}: BoardListColumnProps) {
  return (
    <section
      data-list-id={list.id}
      className={`${styles.list} ${dragging ? styles.dragging : ""} ${
        listDropTarget ? styles.listDropTarget : ""
      }`}
      aria-label={list.name}
    >
      <header
        className={styles.header}
        onPointerDown={(e) => {
          if (!renaming) onHeaderPointerDown(e, list.id);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {renaming ? (
          <InlineTextEdit
            initial={list.name}
            className={styles.nameInput}
            onCommit={(name) => onRenameCommit(list.id, name)}
            onCancel={onRenameCancel}
          />
        ) : (
          <h3 className={styles.name}>{list.name}</h3>
        )}
        <span className={styles.count}>{list.cards.length}</span>
        <button
          type="button"
          className={styles.deleteList}
          aria-label="Excluir lista"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDeleteList(list)}
        >
          ×
        </button>
      </header>

      <div
        className={`${styles.cards} ${dropOnEmpty ? styles.cardsDropTarget : ""}`}
        data-cards
      >
        {list.cards.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            editing={editingCardId === card.id}
            dragging={dragCardId === card.id}
            dropTarget={dropCardId === card.id}
            onPointerDown={onCardPointerDown}
            onToggleDone={onToggleDone}
            onCommitTitle={onCommitCardTitle}
            onCancelEdit={onCancelCardEdit}
            onDelete={onDeleteCard}
          />
        ))}
      </div>

      <footer className={styles.footer}>
        {composerOpen ? (
          <AddCardComposer onAdd={(title) => onAddCard(list.id, title)} onClose={onCloseComposer} />
        ) : (
          <button type="button" className={styles.addCard} onClick={() => onOpenComposer(list.id)}>
            + Adicionar cartão
          </button>
        )}
      </footer>
    </section>
  );
}
