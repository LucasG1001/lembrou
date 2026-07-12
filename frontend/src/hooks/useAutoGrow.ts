import { useLayoutEffect, type RefObject } from "react";

export function useAutoGrow(ref: RefObject<HTMLElement | null>, value: string, enabled = true): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value, enabled]);
}
