import { z } from "zod";

const name = z.string().min(1, "Informe um nome.").max(200);
const cardTitle = z.string().min(1, "Informe um título.").max(500);

export const createProjectSchema = z.object({ name });

export const updateProjectSchema = createProjectSchema;

export const createListSchema = z.object({ name });

export const updateListSchema = createListSchema;

export const createCardSchema = z.object({ title: cardTitle });

export const updateCardSchema = z.object({
  title: cardTitle.optional(),
  done: z.boolean().optional(),
});

export const reorderListsSchema = z.object({
  order: z.array(z.string().uuid("ID inválido.")).min(1, "Forneça ao menos uma lista."),
});

export const moveCardSchema = z.object({
  toListId: z.string().uuid("ID inválido."),
  position: z.number().int().min(0),
});
