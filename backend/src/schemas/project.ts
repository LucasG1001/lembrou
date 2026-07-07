import { z } from "zod";

const name = z.string().min(1, "Informe um nome.").max(200);
const cardTitle = z.string().min(1, "Informe um título.").max(500);
const cardDescription = z.string().max(10000, "Descrição muito longa.");
const cardImages = z
  .array(z.string().startsWith("data:image/", "Imagem inválida.").max(600000, "Imagem muito grande."))
  .max(6, "No máximo 6 imagens por cartão.");
const cardChecklist = z
  .array(z.object({ text: z.string().min(1).max(500), done: z.boolean() }))
  .max(100, "No máximo 100 itens.");

export const createProjectSchema = z.object({ name });

export const updateProjectSchema = createProjectSchema;

export const createListSchema = z.object({ name });

export const updateListSchema = createListSchema;

export const createCardSchema = z.object({ title: cardTitle });

export const updateCardSchema = z.object({
  title: cardTitle.optional(),
  done: z.boolean().optional(),
  description: cardDescription.optional(),
  images: cardImages.optional(),
  checklist: cardChecklist.optional(),
});

export const reorderListsSchema = z.object({
  order: z.array(z.string().uuid("ID inválido.")).min(1, "Forneça ao menos uma lista."),
});

export const moveCardSchema = z.object({
  toListId: z.string().uuid("ID inválido."),
  position: z.number().int().min(0),
});
