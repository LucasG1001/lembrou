export class DomainError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

export class CompletionLockedError extends DomainError {
  constructor() {
    super("Este registro foi marcado automaticamente e não pode ser desfeito.", 409);
    this.name = "CompletionLockedError";
  }
}
