import { z } from "zod";

const question = z.string().min(1, "Informe a pergunta.").max(10000, "Pergunta muito longa.");
const answer = z.string().min(1, "Informe a resposta.").max(10000, "Resposta muito longa.");
const images = z
  .array(z.string().startsWith("data:image/", "Imagem inválida.").max(600000, "Imagem muito grande."))
  .max(6, "No máximo 6 imagens por campo.");
const categoryId = z.string().uuid("Categoria inválida.").nullable();

export const createFlashcardSchema = z.object({
  question,
  answer,
  questionImages: images.optional().default([]),
  answerImages: images.optional().default([]),
  categoryId: categoryId.optional().default(null),
});

export const updateFlashcardSchema = z.object({
  question: question.optional(),
  answer: answer.optional(),
  questionImages: images.optional(),
  answerImages: images.optional(),
  categoryId: categoryId.optional(),
});

export const reviewFlashcardSchema = z.object({
  correct: z.boolean("Resultado inválido."),
});
