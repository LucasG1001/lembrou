export interface Project {
  id: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardRow {
  id: string;
  list_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BoardList {
  id: string;
  projectId: string;
  name: string;
  position: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardListRow {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectBoard extends Project {
  lists: BoardList[];
}

export interface ProjectPatch {
  name?: string;
}

export interface ListPatch {
  name?: string;
}

export interface CardPatch {
  title?: string;
  done?: boolean;
}
