import { useState, type ReactNode } from "react";

interface ConfirmButtonProps {
  onConfirm: () => void;
  idleLabel: ReactNode;
  confirmLabel: ReactNode;
  className?: string;
  confirmClassName?: string;
}

export function ConfirmButton({
  onConfirm,
  idleLabel,
  confirmLabel,
  className,
  confirmClassName,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  return (
    <button
      type="button"
      className={`${className ?? ""} ${armed ? confirmClassName ?? "" : ""}`.trim()}
      onClick={() => {
        if (armed) onConfirm();
        else setArmed(true);
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : idleLabel}
    </button>
  );
}
