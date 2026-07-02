export interface Project {
  id: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
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

export interface BoardList {
  id: string;
  projectId: string;
  name: string;
  position: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBoard extends Project {
  lists: BoardList[];
}

export interface CardPatch {
  title?: string;
  done?: boolean;
}
