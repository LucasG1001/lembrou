import { useEffect, useRef, useState } from "react";

interface InlineTextEditProps {
  initial: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export function InlineTextEdit({
  initial,
  multiline = false,
  placeholder,
  className,
  onCommit,
  onCancel,
}: InlineTextEditProps) {
  const [draft, setDraft] = useState(initial);
  const finishedRef = useRef(false);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el || !multiline) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, multiline]);

  const finish = (commit: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const value = draft.trim();
    if (commit && value && value !== initial.trim()) onCommit(value);
    else onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finish(true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  };

  const shared = {
    value: draft,
    placeholder,
    className,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: () => finish(true),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  };

  if (multiline) {
    return <textarea ref={(el) => void (fieldRef.current = el)} rows={1} {...shared} />;
  }
  return <input ref={(el) => void (fieldRef.current = el)} type="text" {...shared} />;
}
