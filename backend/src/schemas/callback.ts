import { z } from "zod";

export const telegramCallbackSchema = z.object({
  callbackData: z.string().min(1).max(64),
  callbackQueryId: z.string().min(1),
  chatId: z.string().optional(),
  messageId: z.number().nullish(),
  from: z
    .object({
      id: z.number().optional(),
      first_name: z.string().optional(),
      username: z.string().optional(),
    })
    .nullish(),
});
