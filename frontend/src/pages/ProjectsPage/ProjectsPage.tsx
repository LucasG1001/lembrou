import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { ProjectSwitcher } from "../../components/ProjectSwitcher/ProjectSwitcher";
import { BoardListColumn } from "../../components/BoardList/BoardList";
import { InlineTextEdit } from "../../components/InlineTextEdit/InlineTextEdit";
import { moveCardInBoard, moveRelativeTo } from "../../utils/reorder";
import { apiErrorMessage } from "../../utils/apiError";
import type { BoardList, Card } from "../../types/project";
import styles from "./ProjectsPage.module.css";

const LONG_PRESS_MS = 400;
const MOVE_THRESHOLD = 10;
const EDGE_SCROLL_PX = 48;
const EDGE_SCROLL_STEP = 14;

type DragType = "card" | "list";

function alertError(err: unknown, fallback: string): void {
  window.alert(apiErrorMessage(err, fallback));
}

export function ProjectsPage() {
  const {
    projects,
    currentProjectId,
    board,
    loading,
    boardLoading,
    error,
    selectProject,
    createProject,
    renameProject,
    deleteProject,
    createList,
    renameList,
    deleteList,
    reorderLists,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  } = useProjects();

  const [searchParams, setSearchParams] = useSearchParams();

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [composerListId, setComposerListId] = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragListId, setDragListId] = useState<string | null>(null);
  const [previewLists, setPreviewLists] = useState<BoardList[] | null>(null);

  const boardRef = useRef<BoardList[] | null>(null);
  const previewRef = useRef<BoardList[] | null>(null);
  const dragTypeRef = useRef<DragType | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const baseRef = useRef<BoardList[] | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const boardScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // "?novo=1" (botão + do bottom-nav) abre o composer adequado; derivado como na HabitsPage.
  const wantsNew = searchParams.get("novo") === "1";
  const clearNovo = () => {
    if (wantsNew) setSearchParams({}, { replace: true });
  };

  const activeComposerListId =
    composerListId ?? (wantsNew && board && board.length > 0 ? board[0]!.id : null);
  const isAddingList =
    addingList || (wantsNew && Boolean(currentProjectId) && board !== null && board.length === 0);
  const isCreatingProject = creatingProject || (wantsNew && !loading && projects.length === 0);

  const autoScrollAtEdges = () => {
    const { x, y } = lastPointRef.current;
    const boardEl = boardScrollRef.current;
    if (boardEl) {
      const rect = boardEl.getBoundingClientRect();
      if (x < rect.left + EDGE_SCROLL_PX) boardEl.scrollLeft -= EDGE_SCROLL_STEP;
      else if (x > rect.right - EDGE_SCROLL_PX) boardEl.scrollLeft += EDGE_SCROLL_STEP;
    }
    if (dragTypeRef.current === "card") {
      const cardsEl = document
        .elementFromPoint(x, y)
        ?.closest("[data-list-id]")
        ?.querySelector("[data-cards]");
      if (cardsEl) {
        const rect = cardsEl.getBoundingClientRect();
        if (y < rect.top + EDGE_SCROLL_PX) cardsEl.scrollTop -= EDGE_SCROLL_STEP;
        else if (y > rect.bottom - EDGE_SCROLL_PX) cardsEl.scrollTop += EDGE_SCROLL_STEP;
      }
    }
  };

  const updateCardPreview = (x: number, y: number) => {
    const dragId = dragIdRef.current;
    const current = previewRef.current;
    if (!dragId || !current) return;
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    let toListId: string;
    let index: number;
    const cardEl = el.closest("[data-card-id]");
    if (cardEl) {
      const overId = cardEl.getAttribute("data-card-id")!;
      if (overId === dragId) return;
      const list = current.find((l) => l.cards.some((c) => c.id === overId));
      if (!list) return;
      const rect = cardEl.getBoundingClientRect();
      const after = y > rect.top + rect.height / 2;
      const ids = list.cards.filter((c) => c.id !== dragId).map((c) => c.id);
      const overIndex = ids.indexOf(overId);
      if (overIndex === -1) return;
      toListId = list.id;
      index = after ? overIndex + 1 : overIndex;
    } else {
      const listEl = el.closest("[data-list-id]");
      if (!listEl) return;
      const listId = listEl.getAttribute("data-list-id")!;
      const list = current.find((l) => l.id === listId);
      if (!list) return;
      toListId = listId;
      index = list.cards.filter((c) => c.id !== dragId).length;
    }

    const curList = current.find((l) => l.cards.some((c) => c.id === dragId));
    const curIndex = curList ? curList.cards.findIndex((c) => c.id === dragId) : -1;
    if (curList?.id === toListId && curIndex === index) return;

    const next = moveCardInBoard(current, dragId, toListId, index);
    previewRef.current = next;
    setPreviewLists(next);
  };

  const updateListPreview = (x: number, y: number) => {
    const dragId = dragIdRef.current;
    const current = previewRef.current;
    if (!dragId || !current) return;
    const el = document.elementFromPoint(x, y)?.closest("[data-list-id]");
    const overId = el?.getAttribute("data-list-id");
    if (!overId || overId === dragId) return;
    const rect = el!.getBoundingClientRect();
    const after = x > rect.left + rect.width / 2;
    const order = current.map((l) => l.id);
    const nextOrder = moveRelativeTo(order, dragId, overId, after);
    if (nextOrder.every((id, i) => id === order[i])) return;
    const byId = new Map(current.map((l) => [l.id, l]));
    const next = nextOrder.map((id) => byId.get(id)!);
    previewRef.current = next;
    setPreviewLists(next);
  };

  const commitCardDrop = (cardId: string, final: BoardList[], base: BoardList[]) => {
    const finalList = final.find((l) => l.cards.some((c) => c.id === cardId));
    const baseList = base.find((l) => l.cards.some((c) => c.id === cardId));
    if (!finalList || !baseList) return;
    const finalIndex = finalList.cards.findIndex((c) => c.id === cardId);
    const baseIndex = baseList.cards.findIndex((c) => c.id === cardId);
    if (finalList.id === baseList.id && finalIndex === baseIndex) return;
    moveCard(cardId, finalList.id, finalIndex).catch((err) =>
      alertError(err, "Não foi possível mover o cartão.")
    );
  };

  const commitListDrop = (final: BoardList[], base: BoardList[]) => {
    const order = final.map((l) => l.id);
    if (order.every((id, i) => id === base[i]?.id)) return;
    reorderLists(order).catch((err) => alertError(err, "Não foi possível reordenar as listas."));
  };

  const startDrag = (id: string, type: DragType) => {
    const base = boardRef.current;
    if (!base) return;
    if (type === "card" && !base.some((l) => l.cards.some((c) => c.id === id))) return;
    if (type === "list" && !base.some((l) => l.id === id)) return;

    dragTypeRef.current = type;
    dragIdRef.current = id;
    baseRef.current = base;
    previewRef.current = base;
    setPreviewLists(base);
    if (type === "card") setDragCardId(id);
    else setDragListId(id);

    const preventTouch = (ev: TouchEvent) => ev.preventDefault();

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      lastPointRef.current = { x: ev.clientX, y: ev.clientY };
      if (type === "card") updateCardPreview(ev.clientX, ev.clientY);
      else updateListPreview(ev.clientX, ev.clientY);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", preventTouch);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const resetDrag = () => {
      dragTypeRef.current = null;
      dragIdRef.current = null;
      baseRef.current = null;
      previewRef.current = null;
      setPreviewLists(null);
      setDragCardId(null);
      setDragListId(null);
    };

    const onUp = () => {
      cleanup();
      const final = previewRef.current;
      const baseLists = baseRef.current;
      if (final && baseLists) {
        if (type === "card") commitCardDrop(id, final, baseLists);
        else commitListDrop(final, baseLists);
      }
      resetDrag();
    };

    const onCancel = () => {
      cleanup();
      resetDrag();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", preventTouch, { passive: false });

    const loop = () => {
      autoScrollAtEdges();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const beginPress = (e: React.PointerEvent, id: string, type: DragType, onTap: () => void) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (dragTypeRef.current) return;

    const start = { x: e.clientX, y: e.clientY };
    lastPointRef.current = start;
    const isTouch = e.pointerType === "touch";
    let finished = false;

    const clearPress = () => {
      finished = true;
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      window.removeEventListener("pointermove", onPressMove);
      window.removeEventListener("pointerup", onPressUp);
      window.removeEventListener("pointercancel", onPressCancel);
    };

    const onPressMove = (ev: PointerEvent) => {
      if (finished) return;
      const moved =
        Math.abs(ev.clientX - start.x) > MOVE_THRESHOLD ||
        Math.abs(ev.clientY - start.y) > MOVE_THRESHOLD;
      if (!moved) return;
      clearPress();
      if (!isTouch) startDrag(id, type);
    };

    const onPressUp = () => {
      if (finished) return;
      clearPress();
      onTap();
    };

    const onPressCancel = () => {
      clearPress();
    };

    if (isTouch) {
      pressTimerRef.current = window.setTimeout(() => {
        clearPress();
        startDrag(id, type);
      }, LONG_PRESS_MS);
    }
    window.addEventListener("pointermove", onPressMove);
    window.addEventListener("pointerup", onPressUp);
    window.addEventListener("pointercancel", onPressCancel);
  };

  const handleCardPointerDown = (e: React.PointerEvent, card: Card) => {
    if (editingCardId === card.id) return;
    beginPress(e, card.id, "card", () => setEditingCardId(card.id));
  };

  const handleHeaderPointerDown = (e: React.PointerEvent, listId: string) => {
    beginPress(e, listId, "list", () => setRenamingListId(listId));
  };

  const handleCommitCardTitle = (card: Card, title: string) => {
    setEditingCardId(null);
    updateCard(card.id, { title }).catch((err) => alertError(err, "Não foi possível salvar o cartão."));
  };

  const handleToggleDone = (card: Card) => {
    updateCard(card.id, { done: !card.done }).catch((err) =>
      alertError(err, "Não foi possível atualizar o cartão.")
    );
  };

  const handleDeleteCard = (card: Card) => {
    if (!window.confirm(`Excluir "${card.title}"?`)) return;
    deleteCard(card.id).catch((err) => alertError(err, "Não foi possível excluir o cartão."));
  };

  const handleAddCard = (listId: string, title: string) => {
    createCard(listId, title).catch((err) => alertError(err, "Não foi possível criar o cartão."));
  };

  const handleRenameList = (listId: string, name: string) => {
    setRenamingListId(null);
    renameList(listId, name).catch((err) => alertError(err, "Não foi possível renomear a lista."));
  };

  const handleDeleteList = (list: BoardList) => {
    const confirmed =
      list.cards.length === 0 ||
      window.confirm(
        `Excluir a lista "${list.name}" e seu${list.cards.length === 1 ? "" : "s"} ${list.cards.length} cart${
          list.cards.length === 1 ? "ão" : "ões"
        }?`
      );
    if (!confirmed) return;
    deleteList(list.id).catch((err) => alertError(err, "Não foi possível excluir a lista."));
  };

  const handleCreateList = (name: string) => {
    setAddingList(false);
    clearNovo();
    createList(name).catch((err) => alertError(err, "Não foi possível criar a lista."));
  };

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const lists = previewLists ?? board;
  const dragging = Boolean(dragCardId || dragListId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <ProjectSwitcher
          projects={projects}
          current={currentProject}
          onSelect={selectProject}
          onCreate={(name) =>
            createProject(name).catch((err) => alertError(err, "Não foi possível criar o projeto."))
          }
          onRename={(id, name) =>
            renameProject(id, name).catch((err) => alertError(err, "Não foi possível renomear o projeto."))
          }
          onDelete={(id) =>
            deleteProject(id).catch((err) => alertError(err, "Não foi possível excluir o projeto."))
          }
        />
      </header>

      {loading && <p className={styles.muted}>Carregando…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum projeto ainda</p>
          <p className={styles.muted}>Crie um projeto para organizar seus cartões.</p>
          {isCreatingProject ? (
            <InlineTextEdit
              initial=""
              placeholder="Nome do projeto"
              className={styles.emptyInput}
              onCommit={(name) => {
                setCreatingProject(false);
                clearNovo();
                createProject(name).catch((err) => alertError(err, "Não foi possível criar o projeto."));
              }}
              onCancel={() => {
                setCreatingProject(false);
                clearNovo();
              }}
            />
          ) : (
            <button type="button" className={styles.emptyButton} onClick={() => setCreatingProject(true)}>
              + Criar primeiro projeto
            </button>
          )}
        </div>
      )}

      {!loading && !error && currentProject && (
        <>
          {boardLoading && !lists && <p className={styles.muted}>Carregando…</p>}
          {lists && (
            <div
              ref={boardScrollRef}
              className={`${styles.board} ${dragging ? styles.boardDragging : ""}`}
            >
              {lists.map((list) => (
                <BoardListColumn
                  key={list.id}
                  list={list}
                  dragging={dragListId === list.id}
                  dragCardId={dragCardId}
                  editingCardId={editingCardId}
                  renaming={renamingListId === list.id}
                  composerOpen={activeComposerListId === list.id}
                  onHeaderPointerDown={handleHeaderPointerDown}
                  onRenameCommit={handleRenameList}
                  onRenameCancel={() => setRenamingListId(null)}
                  onDeleteList={handleDeleteList}
                  onOpenComposer={setComposerListId}
                  onCloseComposer={() => {
                    setComposerListId(null);
                    clearNovo();
                  }}
                  onAddCard={handleAddCard}
                  onCardPointerDown={handleCardPointerDown}
                  onToggleDone={handleToggleDone}
                  onCommitCardTitle={handleCommitCardTitle}
                  onCancelCardEdit={() => setEditingCardId(null)}
                  onDeleteCard={handleDeleteCard}
                />
              ))}

              <div className={styles.addListColumn}>
                {isAddingList ? (
                  <InlineTextEdit
                    initial=""
                    placeholder="Nome da lista"
                    className={styles.addListInput}
                    onCommit={handleCreateList}
                    onCancel={() => {
                      setAddingList(false);
                      clearNovo();
                    }}
                  />
                ) : (
                  <button type="button" className={styles.addListButton} onClick={() => setAddingList(true)}>
                    + Adicionar lista
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
