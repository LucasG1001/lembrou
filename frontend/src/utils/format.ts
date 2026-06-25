import type { Reminder, RecurUnit, ReminderStatus } from "../types/reminder";

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

export function formatEventAt(reminder: Reminder): string {
  const d = new Date(reminder.eventAt);
  if (reminder.isAllDay) {
    return d.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return d.toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export const STATUS_LABEL: Record<ReminderStatus, string> = {
  active: "Ativo",
  done: "Concluído",
  cancelled: "Cancelado",
};
