import { useCallback, useState, type ReactNode } from "react";
import { ReminderCalendar } from "../components/ReminderCalendar/ReminderCalendar";
import { fetchReminders } from "../services/reminderService";
import { countRemindersByDay } from "../utils/agenda";
import { CalendarContext } from "./useCalendar";

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [countByDay, setCountByDay] = useState<Map<string, number>>(() => new Map());

  const open = useCallback(() => {
    setIsOpen(true);
    fetchReminders("active")
      .then((data) => setCountByDay(countRemindersByDay(data)))
      .catch(() => setCountByDay(new Map()));
  }, []);

  return (
    <CalendarContext.Provider value={{ open }}>
      {children}
      {isOpen && <ReminderCalendar countByDay={countByDay} onClose={() => setIsOpen(false)} />}
    </CalendarContext.Provider>
  );
}
