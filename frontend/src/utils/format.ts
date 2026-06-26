import type { Reminder, RecurUnit } from "../types/reminder";

const TZ = "America/Sao_Paulo";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const UNIT_SINGULAR: Record<RecurUnit, string> = {
  day: "dia",
  week: "semana",
  month: "mês",
  year: "ano",
};
const UNIT_PLURAL: Record<RecurUnit, string> = {
  day: "dias",
  week: "semanas",
  month: "meses",
  year: "anos",
};

/** Quebra o event_at (UTC) em campos de formulário no fuso de São Paulo. */
export function toFormParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return { date, time };
}

export function recurrenceLabel(reminder: Reminder): string | null {
  if (!reminder.recurInterval || !reminder.recurUnit) return null;
  const n = reminder.recurInterval;
  const unit = n === 1 ? UNIT_SINGULAR[reminder.recurUnit] : UNIT_PLURAL[reminder.recurUnit];
  const base = n === 1 ? `A cada ${unit}` : `A cada ${n} ${unit}`;
  if (reminder.recurWeekday !== null) {
    return `${base}, ${WEEKDAYS[reminder.recurWeekday].toLowerCase()}`;
  }
  return base;
}

export function formatRemaining(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff < 60_000) return "agora";

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);

  return parts.join(" ");
}

export function remainingLabel(targetMs: number, nowMs: number): { text: string; overdue: boolean } {
  if (targetMs > nowMs) {
    return { text: `faltam ${formatRemaining(targetMs, nowMs)}`, overdue: false };
  }
  const elapsed = formatRemaining(nowMs, targetMs);
  return { text: elapsed === "agora" ? "atrasado" : `atrasado ${elapsed}`, overdue: true };
}
