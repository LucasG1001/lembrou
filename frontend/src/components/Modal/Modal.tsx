import type { ReactNode } from "react";
import { useDismiss } from "../../hooks/useDismiss";
import styles from "./Modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  hideClose?: boolean;
  footerStart?: ReactNode;
  children: ReactNode;
}

export function Modal({
  title,
  onClose,
  onSubmit,
  submitLabel = "Salvar",
  submitDisabled = false,
  hideClose = false,
  footerStart,
  children,
}: ModalProps) {
  useDismiss(onClose);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      <form className={styles.modal} onSubmit={handleSubmit}>
        {(title || !hideClose) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {!hideClose && (
              <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                ×
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          {footerStart ?? <span />}
          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={submitDisabled}>
              {submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
