import type { Request, Response, NextFunction } from "express";

/**
 * Confere o segredo enviado pela notify-api no header x-callback-secret. Se
 * CALLBACK_SECRET não estiver configurado, o endpoint fica liberado (dev).
 */
export function requireCallbackSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.CALLBACK_SECRET;
  if (!expected) {
    next();
    return;
  }
  if (req.header("x-callback-secret") !== expected) {
    res.status(401).json({ error: "Segredo de callback inválido." });
    return;
  }
  next();
}
