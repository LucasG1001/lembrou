import { useMemo, useState } from "react";
import type { FlashcardSummary } from "../../types/flashcard";
import type { FlashcardCategory } from "../../types/flashcardCategory";
import { categoryLabel, categoryTints, NEUTRAL_TINTS, tints } from "../../utils/flashcardPalette";
import styles from "./FlashcardList.module.css";

interface FlashcardListProps {
  cards: FlashcardSummary[];
  categories: FlashcardCategory[];
  onEdit: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onMove: (ids: string[], categoryId: string | null) => void;
  onManageCategories: () => void;
}

type Filter = "all" | "none" | string;

export function FlashcardList({
  cards,
  categories,
  onEdit,
  onDelete,
  onMove,
  onManageCategories,
}: FlashcardListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    map.set("all", cards.length);
    map.set("none", cards.filter((c) => !c.categoryId).length);
    for (const cat of categories) {
      map.set(cat.id, cards.filter((c) => c.categoryId === cat.id).length);
    }
    return map;
  }, [cards, categories]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter === "none" && c.categoryId) return false;
      if (filter !== "all" && filter !== "none" && c.categoryId !== filter) return false;
      if (q && !`${c.question} ${c.answer}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, filter, search]);

  const catTints = (id: string | null) => categoryTints(categories, id);
  const catLabel = (id: string | null) => categoryLabel(categories, id);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleIds = visible.map((c) => c.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = visibleIds.some((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visibleIds));
  }

  function clearSelection() {
    setSelected(new Set());
    setMoveOpen(false);
  }

  const selectedIds = [...selected];

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Excluir ${selectedIds.length} cartão(ões)?`)) return;
    onDelete(selectedIds);
    clearSelection();
  }

  function handleMove(categoryId: string | null) {
    onMove(selectedIds, categoryId);
    clearSelection();
  }

  function handleRowDelete(id: string) {
    if (!window.confirm("Excluir este cartão?")) return;
    onDelete([id]);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const filterPills: { id: Filter; label: string }[] = [
    { id: "all", label: "Todos" },
    ...((counts.get("none") ?? 0) > 0 ? [{ id: "none" as Filter, label: "Sem categoria" }] : []),
    ...categories.map((c) => ({ id: c.id as Filter, label: c.name })),
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filtrar por categoria">
          {filterPills.map((p) => {
            const active = filter === p.id;
            const t = p.id === "all" || p.id === "none" ? NEUTRAL_TINTS : catTints(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
                onClick={() => setFilter(p.id)}
                style={
                  active && p.id !== "all" && p.id !== "none"
                    ? { background: t.bg, color: t.fg, borderColor: t.border }
                    : undefined
                }
              >
                {p.id !== "all" && (
                  <span className={styles.dot} style={{ background: t.dot }} />
                )}
                {p.label}
                <span className={styles.chipCount}>{counts.get(p.id) ?? 0}</span>
              </button>
            );
          })}
          <button type="button" className={styles.manageButton} onClick={onManageCategories}>
            + Categorias
          </button>
        </div>

        <input
          type="search"
          className={styles.search}
          placeholder="Buscar cartões…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedIds.length} selecionado(s)</span>
          <div className={styles.moveWrapper}>
            <button
              type="button"
              className={styles.bulkButton}
              onClick={() => setMoveOpen((o) => !o)}
            >
              Mover para ▾
            </button>
            {moveOpen && (
              <>
                <div className={styles.moveBackdrop} onClick={() => setMoveOpen(false)} />
                <div className={styles.moveMenu}>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={styles.moveItem}
                      onClick={() => handleMove(c.id)}
                    >
                      <span className={styles.dot} style={{ background: tints(c.color).dot }} />
                      {c.name}
                    </button>
                  ))}
                  <button type="button" className={styles.moveItem} onClick={() => handleMove(null)}>
                    <span className={styles.dot} style={{ background: NEUTRAL_TINTS.dot }} />
                    Sem categoria
                  </button>
                </div>
              </>
            )}
          </div>
          <span className={styles.spacer} />
          <button
            type="button"
            className={`${styles.bulkButton} ${styles.bulkDelete}`}
            onClick={handleBulkDelete}
          >
            Excluir
          </button>
          <button type="button" className={styles.bulkButton} onClick={clearSelection}>
            Limpar
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🗂️</div>
          <p className={styles.emptyTitle}>Nenhum cartão encontrado</p>
          <p className={styles.muted}>Ajuste a busca/filtro ou crie um novo cartão.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <button
              type="button"
              className={`${styles.check} ${allSelected ? styles.checkOn : ""}`}
              onClick={toggleAll}
              aria-label="Selecionar todos"
            >
              {allSelected ? "✓" : someSelected ? "–" : ""}
            </button>
            <span className={styles.colHead}>Frente</span>
            <span className={styles.colHead}>Verso</span>
            <span className={styles.colHead}>Categoria</span>
            <span />
          </div>

          {visible.map((c) => {
            const t = catTints(c.categoryId);
            const sel = selected.has(c.id);
            return (
              <div key={c.id} className={`${styles.row} ${sel ? styles.rowSelected : ""}`}>
                <button
                  type="button"
                  className={`${styles.check} ${sel ? styles.checkOn : ""}`}
                  onClick={() => toggle(c.id)}
                  aria-label="Selecionar cartão"
                >
                  {sel ? "✓" : ""}
                </button>
                <span className={styles.front}>{c.question}</span>
                <span className={styles.back}>{c.answer}</span>
                <span className={styles.catCell}>
                  <span
                    className={styles.tag}
                    style={{ background: t.bg, color: t.fg, borderColor: t.border }}
                  >
                    <span className={styles.dot} style={{ background: t.dot }} />
                    {catLabel(c.categoryId)}
                  </span>
                </span>
                <span className={styles.actions}>
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => onEdit(c.id)}
                    aria-label="Editar"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={`${styles.action} ${styles.actionDanger}`}
                    onClick={() => handleRowDelete(c.id)}
                    aria-label="Excluir"
                  >
                    🗑
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
