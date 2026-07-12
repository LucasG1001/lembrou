import { pool } from "../database/connection.js";
import { updateById, withTransaction } from "../database/transaction.js";
import { buildUpdateSet, nextPositionSql } from "../lib/sqlUpdate.js";
import { DomainError } from "./errors.js";
import type {
  BoardList,
  BoardListRow,
  Card,
  CardPatch,
  CardRow,
  ChecklistItem,
  ListPatch,
  Project,
  ProjectBoard,
  ProjectPatch,
  ProjectRow,
} from "../types/project.js";

function parseChecklist(raw: unknown): ChecklistItem[] {
  if (Array.isArray(raw)) return raw as ChecklistItem[];
  if (typeof raw !== "string") return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as ChecklistItem[]) : [];
  } catch {
    return [];
  }
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    done: row.done,
    description: row.description ?? "",
    images: row.images ?? [],
    checklist: parseChecklist(row.checklist),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBoardList(row: BoardListRow, cardRows: CardRow[]): BoardList {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    position: row.position,
    cards: cardRows.filter((c) => c.list_id === row.id).map(toCard),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllProjects(): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(
    "SELECT * FROM projects ORDER BY position ASC, created_at ASC"
  );
  return result.rows.map(toProject);
}

export async function findBoard(projectId: string): Promise<ProjectBoard | null> {
  const project = await pool.query<ProjectRow>("SELECT * FROM projects WHERE id = $1", [projectId]);
  if (!project.rows[0]) return null;

  const lists = await pool.query<BoardListRow>(
    "SELECT * FROM board_lists WHERE project_id = $1 ORDER BY position ASC, created_at ASC",
    [projectId]
  );
  const cards = await pool.query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN board_lists l ON l.id = c.list_id
     WHERE l.project_id = $1
     ORDER BY c.position ASC, c.created_at ASC`,
    [projectId]
  );

  return {
    ...toProject(project.rows[0]),
    lists: lists.rows.map((row) => toBoardList(row, cards.rows)),
  };
}

export async function createProject(name: string): Promise<Project> {
  const result = await pool.query<ProjectRow>(
    `INSERT INTO projects (name, position)
     VALUES ($1, ${nextPositionSql("projects")})
     RETURNING *`,
    [name]
  );
  return toProject(result.rows[0]!);
}

export async function updateProject(id: string, patch: ProjectPatch): Promise<Project | null> {
  const { sets, values, nextIndex } = buildUpdateSet(patch, { name: "name" });
  const row = await updateById<ProjectRow>("projects", id, sets, values, nextIndex);
  return row ? toProject(row) : null;
}

export async function removeProject(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function createList(projectId: string, name: string): Promise<BoardList | null> {
  const project = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);
  if (!project.rows[0]) return null;

  const result = await pool.query<BoardListRow>(
    `INSERT INTO board_lists (project_id, name, position)
     VALUES ($1, $2, ${nextPositionSql("board_lists", "project_id = $1")})
     RETURNING *`,
    [projectId, name]
  );
  return toBoardList(result.rows[0]!, []);
}

export async function updateList(id: string, patch: ListPatch): Promise<BoardList | null> {
  const { sets, values, nextIndex } = buildUpdateSet(patch, { name: "name" });
  const row = await updateById<BoardListRow>("board_lists", id, sets, values, nextIndex);
  if (!row) return null;
  const cards = await pool.query<CardRow>(
    "SELECT * FROM cards WHERE list_id = $1 ORDER BY position ASC, created_at ASC",
    [id]
  );
  return toBoardList(row, cards.rows);
}

export async function removeList(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM board_lists WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function reorderLists(projectId: string, orderedIds: string[]): Promise<ProjectBoard | null> {
  await withTransaction(async (client) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        "UPDATE board_lists SET position = $1, updated_at = NOW() WHERE id = $2 AND project_id = $3",
        [i, orderedIds[i], projectId]
      );
    }
  });
  return findBoard(projectId);
}

export async function createCard(listId: string, title: string): Promise<Card | null> {
  const list = await pool.query("SELECT id FROM board_lists WHERE id = $1", [listId]);
  if (!list.rows[0]) return null;

  const result = await pool.query<CardRow>(
    `INSERT INTO cards (list_id, title, position)
     VALUES ($1, $2, ${nextPositionSql("cards", "list_id = $1")})
     RETURNING *`,
    [listId, title]
  );
  return toCard(result.rows[0]!);
}

export async function updateCard(id: string, patch: CardPatch): Promise<Card | null> {
  const { checklist, ...rest } = patch;
  const { sets, values, nextIndex } = buildUpdateSet(rest, {
    title: "title",
    done: "done",
    description: "description",
    images: "images",
  });
  let idIndex = nextIndex;
  if (checklist !== undefined) {
    sets.push(`checklist = $${idIndex++}`);
    values.push(JSON.stringify(checklist));
  }
  const row = await updateById<CardRow>("cards", id, sets, values, idIndex);
  return row ? toCard(row) : null;
}

export async function removeCard(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM cards WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function moveCard(cardId: string, toListId: string, position: number): Promise<ProjectBoard | null> {
  const projectId = await withTransaction(async (client) => {
    const cardResult = await client.query<CardRow>("SELECT * FROM cards WHERE id = $1", [cardId]);
    const card = cardResult.rows[0];
    if (!card) throw new DomainError("Cartão não encontrado.", 404);

    const listsResult = await client.query<BoardListRow>(
      "SELECT * FROM board_lists WHERE id = ANY($1::uuid[])",
      [[card.list_id, toListId]]
    );
    const source = listsResult.rows.find((l) => l.id === card.list_id)!;
    const target = listsResult.rows.find((l) => l.id === toListId);
    if (!target) throw new DomainError("Lista de destino não encontrada.", 404);
    if (target.project_id !== source.project_id) {
      throw new DomainError("A lista de destino pertence a outro projeto.", 400);
    }

    const targetResult = await client.query<{ id: string }>(
      "SELECT id FROM cards WHERE list_id = $1 AND id <> $2 ORDER BY position ASC, created_at ASC",
      [toListId, cardId]
    );
    const targetIds = targetResult.rows.map((r) => r.id);
    const index = Math.max(0, Math.min(position, targetIds.length));
    targetIds.splice(index, 0, cardId);

    await client.query("UPDATE cards SET list_id = $1, updated_at = NOW() WHERE id = $2", [toListId, cardId]);
    for (let i = 0; i < targetIds.length; i++) {
      await client.query("UPDATE cards SET position = $1 WHERE id = $2", [i, targetIds[i]]);
    }

    if (card.list_id !== toListId) {
      const sourceResult = await client.query<{ id: string }>(
        "SELECT id FROM cards WHERE list_id = $1 AND id <> $2 ORDER BY position ASC, created_at ASC",
        [card.list_id, cardId]
      );
      for (let i = 0; i < sourceResult.rows.length; i++) {
        await client.query("UPDATE cards SET position = $1 WHERE id = $2", [i, sourceResult.rows[i]!.id]);
      }
    }

    return source.project_id;
  });
  return findBoard(projectId);
}
