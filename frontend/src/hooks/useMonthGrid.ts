import { useCallback, useMemo, useState } from "react";
import { getToday } from "../utils/dateUtils";
import { MONTH_PT } from "../utils/month";

interface MonthView {
  year: number;
  month: number;
}

export function useMonthGrid() {
  const today = getToday();
  const [view, setView] = useState<MonthView>(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const goPrev = useCallback(() => {
    setView((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }));
  }, []);

  const goNext = useCallback(() => {
    setView((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }));
  }, []);

  const { firstDayOffset, days } = useMemo(() => {
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    return {
      firstDayOffset: new Date(view.year, view.month, 1).getDay(),
      days: Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1)),
    };
  }, [view]);

  return {
    view,
    goPrev,
    goNext,
    monthLabel: `${MONTH_PT[view.month]} ${view.year}`,
    firstDayOffset,
    days,
  };
}
