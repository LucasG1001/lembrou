import { useCallback, useEffect, useState } from "react";
import type { BoardList, Card, CardPatch, Project } from "../types/project";
import {
  fetchProjects,
  fetchBoard,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  createList as apiCreateList,
  updateList as apiUpdateList,
  deleteList as apiDeleteList,
  reorderLists as apiReorderLists,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  deleteCard as apiDeleteCard,
  moveCard as apiMoveCard,
} from "../services/projectService";
import { moveCardInBoard } from "../utils/reorder";

const PROJECT_STORAGE_KEY = "current-project-id";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardList[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const boardLoading = Boolean(currentProjectId) && board === null;

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
        const next = data.some((p) => p.id === saved) ? saved : data[0]?.id ?? null;
        if (next) localStorage.setItem(PROJECT_STORAGE_KEY, next);
        else localStorage.removeItem(PROJECT_STORAGE_KEY);
        setCurrentProjectId(next);
      })
      .catch(() => setError("Não foi possível carregar os projetos."))
      .finally(() => setLoading(false));
  }, []);

  // Quem zera o board é quem troca o projeto (selectProject/createProject/deleteProject).
  useEffect(() => {
    if (!currentProjectId) return;
    let active = true;
    fetchBoard(currentProjectId)
      .then((data) => {
        if (active) setBoard(data.lists);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o quadro.");
      });
    return () => {
      active = false;
    };
  }, [currentProjectId]);

  const selectProject = useCallback((id: string) => {
    localStorage.setItem(PROJECT_STORAGE_KEY, id);
    setBoard(null);
    setCurrentProjectId(id);
  }, []);

  const createProject = useCallback(async (name: string) => {
    const created = await apiCreateProject(name);
    setProjects((prev) => [...prev, created]);
    localStorage.setItem(PROJECT_STORAGE_KEY, created.id);
    setBoard(null);
    setCurrentProjectId(created.id);
  }, []);

  const renameProject = useCallback(async (id: string, name: string) => {
    const updated = await apiUpdateProject(id, name);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      await apiDeleteProject(id);
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        if (id === currentProjectId) {
          const next = remaining[0]?.id ?? null;
          if (next) localStorage.setItem(PROJECT_STORAGE_KEY, next);
          else localStorage.removeItem(PROJECT_STORAGE_KEY);
          setBoard(null);
          setCurrentProjectId(next);
        }
        return remaining;
      });
    },
    [currentProjectId]
  );

  const createList = useCallback(
    async (name: string) => {
      if (!currentProjectId) return;
      const created = await apiCreateList(currentProjectId, name);
      setBoard((prev) => (prev ? [...prev, created] : [created]));
    },
    [currentProjectId]
  );

  const renameList = useCallback(async (listId: string, name: string) => {
    const updated = await apiUpdateList(listId, name);
    setBoard((prev) => (prev ? prev.map((l) => (l.id === listId ? updated : l)) : prev));
  }, []);

  const deleteList = useCallback(async (listId: string) => {
    await apiDeleteList(listId);
    setBoard((prev) => (prev ? prev.filter((l) => l.id !== listId) : prev));
  }, []);

  const reorderLists = useCallback(
    async (orderedIds: string[]) => {
      if (!currentProjectId) return;
      let previous: BoardList[] | null = null;
      setBoard((prev) => {
        previous = prev;
        if (!prev) return prev;
        const byId = new Map(prev.map((l) => [l.id, l]));
        const next = orderedIds.map((id) => byId.get(id)).filter((l): l is BoardList => Boolean(l));
        return next.length === prev.length ? next : prev;
      });
      try {
        const fresh = await apiReorderLists(currentProjectId, orderedIds);
        setBoard(fresh.lists);
      } catch (err) {
        setBoard(previous);
        throw err;
      }
    },
    [currentProjectId]
  );

  const createCard = useCallback(async (listId: string, title: string) => {
    const created = await apiCreateCard(listId, title);
    setBoard((prev) =>
      prev ? prev.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, created] } : l)) : prev
    );
  }, []);

  const applyCardPatch = useCallback((cardId: string, patch: Partial<Card>) => {
    setBoard((prev) =>
      prev
        ? prev.map((l) => ({
            ...l,
            cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
          }))
        : prev
    );
  }, []);

  const updateCard = useCallback(
    async (cardId: string, patch: CardPatch) => {
      let previous: BoardList[] | null = null;
      setBoard((prev) => {
        previous = prev;
        return prev;
      });
      applyCardPatch(cardId, patch);
      try {
        const updated = await apiUpdateCard(cardId, patch);
        applyCardPatch(cardId, updated);
      } catch (err) {
        setBoard(previous);
        throw err;
      }
    },
    [applyCardPatch]
  );

  const deleteCard = useCallback(async (cardId: string) => {
    await apiDeleteCard(cardId);
    setBoard((prev) =>
      prev ? prev.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })) : prev
    );
  }, []);

  const moveCard = useCallback(async (cardId: string, toListId: string, index: number) => {
    let previous: BoardList[] | null = null;
    setBoard((prev) => {
      previous = prev;
      return prev ? moveCardInBoard(prev, cardId, toListId, index) : prev;
    });
    try {
      const fresh = await apiMoveCard(cardId, toListId, index);
      setBoard(fresh.lists);
    } catch (err) {
      setBoard(previous);
      throw err;
    }
  }, []);

  return {
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
  };
}
