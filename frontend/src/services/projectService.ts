import { api } from "./api";
import type { BoardList, Card, CardPatch, Project, ProjectBoard } from "../types/project";

export async function fetchProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>("/api/projects");
  return response.data;
}

export async function fetchBoard(projectId: string): Promise<ProjectBoard> {
  const response = await api.get<ProjectBoard>(`/api/projects/${projectId}`);
  return response.data;
}

export async function createProject(name: string): Promise<Project> {
  const response = await api.post<Project>("/api/projects", { name });
  return response.data;
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const response = await api.put<Project>(`/api/projects/${id}`, { name });
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}

export async function createList(projectId: string, name: string): Promise<BoardList> {
  const response = await api.post<BoardList>(`/api/projects/${projectId}/lists`, { name });
  return response.data;
}

export async function updateList(listId: string, name: string): Promise<BoardList> {
  const response = await api.put<BoardList>(`/api/projects/lists/${listId}`, { name });
  return response.data;
}

export async function deleteList(listId: string): Promise<void> {
  await api.delete(`/api/projects/lists/${listId}`);
}

export async function reorderLists(projectId: string, order: string[]): Promise<ProjectBoard> {
  const response = await api.post<ProjectBoard>(`/api/projects/${projectId}/lists/reorder`, { order });
  return response.data;
}

export async function createCard(listId: string, title: string): Promise<Card> {
  const response = await api.post<Card>(`/api/projects/lists/${listId}/cards`, { title });
  return response.data;
}

export async function updateCard(cardId: string, patch: CardPatch): Promise<Card> {
  const response = await api.put<Card>(`/api/projects/cards/${cardId}`, patch);
  return response.data;
}

export async function deleteCard(cardId: string): Promise<void> {
  await api.delete(`/api/projects/cards/${cardId}`);
}

export async function moveCard(cardId: string, toListId: string, position: number): Promise<ProjectBoard> {
  const response = await api.post<ProjectBoard>(`/api/projects/cards/${cardId}/move`, { toListId, position });
  return response.data;
}
