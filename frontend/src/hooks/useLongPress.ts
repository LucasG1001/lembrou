import { useRef } from "react";

interface UseLongPressOptions<T> {
  onTap: (payload: T) => void;
  onLongPress: (payload: T) => void;
  delay?: number;
}

export const MOVE_THRESHOLD = 10;
export const LONG_PRESS_DRAG_MS = 400;

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

/** Distingue toque (tap) de pressionar-e-segurar via Pointer Events. */
export function useLongPress<T>({ onTap, onLongPress, delay = 500 }: UseLongPressOptions<T>) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  const moved = useRef(false);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return function bind(payload: T): LongPressHandlers {
    return {
      onPointerDown: (e) => {
        fired.current = false;
        moved.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = setTimeout(() => {
          fired.current = true;
          onLongPress(payload);
        }, delay);
      },
      onPointerMove: (e) => {
        if (moved.current) return;
        if (
          Math.abs(e.clientX - start.current.x) > MOVE_THRESHOLD ||
          Math.abs(e.clientY - start.current.y) > MOVE_THRESHOLD
        ) {
          moved.current = true;
          clear();
        }
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onClick: () => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        if (!moved.current) onTap(payload);
      },
      onContextMenu: (e) => e.preventDefault(),
    };
  };
}
