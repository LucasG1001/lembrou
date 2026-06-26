export class CompletionLockedError extends Error {
  constructor() {
    super("Este registro foi marcado automaticamente e não pode ser desfeito.");
    this.name = "CompletionLockedError";
  }
}
