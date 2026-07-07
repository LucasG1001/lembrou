import { createContext, useContext } from "react";

export interface CalendarContextValue {
  open: () => void;
}

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar precisa estar dentro de CalendarProvider.");
  return ctx;
}
