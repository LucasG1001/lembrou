import type { Request, Response } from "express";
import { telegramCallbackSchema } from "../schemas/callback.js";
import { applyCallback } from "../services/callbackService.js";

export async function handleCallback(req: Request, res: Response): Promise<void> {
  try {
    const parsed = telegramCallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Callback inválido." });
      return;
    }
    const result = await applyCallback(parsed.data.callbackData);
    res.json(result);
  } catch {
    res.status(500).json({ toast: "Erro ao processar ação." });
  }
}
