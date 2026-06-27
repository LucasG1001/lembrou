import { MONTH_PT } from "./month";

export interface TimelineItem {
  id: string;
  kind: string;
  title: string;
  when: number;
  detail: string;
  hasTime: boolean;
  subtitle?: string;
  subtitleTone?: "danger";
  done?: boolean;
}

export interface TimelineGroup {
  key: string;
  label: string;
  items: TimelineItem[];
}

const WEEKDAY_ABBR_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function splitAgenda(items: TimelineItem[]): { week: TimelineItem[]; later: TimelineItem[] } {
  const limit = startOfToday() + 7 * 24 * 60 * 60 * 1000;
  const week: TimelineItem[] = [];
  const later: TimelineItem[] = [];
  for (const item of items) {
    if (item.when < limit) week.push(item);
    else later.push(item);
  }
  return { week, later };
}

function dayLabel(when: number): string {
  const today = startOfToday();
  const day = 24 * 60 * 60 * 1000;
  const diff = Math.floor((when - today) / day);
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  const d = new Date(when);
  return `${WEEKDAY_ABBR_PT[d.getDay()]} ${d.getDate()}`;
}

export function groupByDay(items: TimelineItem[]): TimelineGroup[] {
  const map = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const d = new Date(item.when);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map.entries()).map(([key, list]) => ({
    key,
    label: dayLabel(list[0]!.when),
    items: list,
  }));
}

export function groupByMonth(items: TimelineItem[]): TimelineGroup[] {
  const currentYear = new Date().getFullYear();
  const map = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const d = new Date(item.when);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const d = new Date(list[0]!.when);
    const month = MONTH_PT[d.getMonth()];
    const year = d.getFullYear();
    return {
      key,
      label: year === currentYear ? month! : `${month} ${year}`,
      items: list,
    };
  });
}

export function itemTime(item: TimelineItem, withDate: boolean): string {
  const d = new Date(item.when);
  const time = item.hasTime
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
  if (!withDate) return time || "—";
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return time ? `${date} ${time}` : date;
}
