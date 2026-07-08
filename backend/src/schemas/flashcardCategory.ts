import { z } from "zod";

// Paleta fixa de swatches — igual à do frontend (utils/flashcardPalette).
export const CATEGORY_COLORS = ["#b7aefc", "#6ee7a8", "#ff9b8a", "#8fc5ff", "#f0c878"] as const;

const name = z.string().trim().min(1, "Informe o nome da categoria.").max(60, "Nome muito longo.");
const color = z.enum(CATEGORY_COLORS, "Cor inválida.");

export const createCategorySchema = z.object({
  name,
  color,
});

export const updateCategorySchema = z.object({
  name: name.optional(),
  color: color.optional(),
});
