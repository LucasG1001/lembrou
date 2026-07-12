import { del, get, post, put } from "./api";
import type { BoardList, Card, CardPatch, Project, ProjectBoard } from "../types/project";

export function fetchProjects(): Promise<Project[]> {
  return get<Project[]>("/api/projects");
}

export function fetchBoard(projectId: string): Promise<ProjectBoard> {
  return get<ProjectBoard>(`/api/projects/${projectId}`);
}

export function createProject(name: string): Promise<Project> {
  return post<Project>("/api/projects", { name });
}

export function updateProject(id: string, name: string): Promise<Project> {
  return put<Project>(`/api/projects/${id}`, { name });
}

export function deleteProject(id: string): Promise<void> {
  return del(`/api/projects/${id}`);
}

export function createList(projectId: string, name: string): Promise<BoardList> {
  return post<BoardList>(`/api/projects/${projectId}/lists`, { name });
}

export function updateList(listId: string, name: string): Promise<BoardList> {
  return put<BoardList>(`/api/projects/lists/${listId}`, { name });
}

export function deleteList(listId: string): Promise<void> {
  return del(`/api/projects/lists/${listId}`);
}

export function reorderLists(projectId: string, order: string[]): Promise<ProjectBoard> {
  return post<ProjectBoard>(`/api/projects/${projectId}/lists/reorder`, { order });
}

export function createCard(listId: string, title: string): Promise<Card> {
  return post<Card>(`/api/projects/lists/${listId}/cards`, { title });
}

export function updateCard(cardId: string, patch: CardPatch): Promise<Card> {
  return put<Card>(`/api/projects/cards/${cardId}`, patch);
}

export function deleteCard(cardId: string): Promise<void> {
  return del(`/api/projects/cards/${cardId}`);
}

export function moveCard(cardId: string, toListId: string, position: number): Promise<ProjectBoard> {
  return post<ProjectBoard>(`/api/projects/cards/${cardId}/move`, { toListId, position });
}
