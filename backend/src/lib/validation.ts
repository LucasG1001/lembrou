import type { Response } from "express";
import type { ZodError } from "zod";

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function respondValidationError(
  res: Response,
  error: ZodError,
  fallback = "Dados inválidos."
): void {
  res.status(400).json({ error: error.issues[0]?.message ?? fallback });
}
