import type { Reminder, ReminderPatch, ReminderPhase } from "../types/reminder.js";
import { addMinutes, computeNextOccurrence, fromSpParts, spDateAtTime, toSpParts } from "../lib/dateUtils.js";
import * as messages from "./reminderMessages.js";

const LEAD_1_MIN = 30;
const LEAD_2_MIN = 5;
const NAG_INTERVAL_MIN = 10;
const ALLDAY_BEFORE_HOUR = 8;
const ALLDAY_MORNING_HOUR = 8;

export interface ReminderMessage {
  title: string;
  description: string;
}

export interface TickResult {
  /** Mensagem a enviar (sempre presente nas transições atuais). */
  message: ReminderMessage;
  /** Campos a persistir após o envio. */
  patch: ReminderPatch;
}

export function isRecurring(r: Pick<Reminder, "recurInterval" | "recurUnit">): boolean {
  return r.recurInterval !== null && r.recurUnit !== null;
}

/** Fase e horário do primeiro disparo a partir do event_at. Pula etapas já vencidas. */
export function initialSchedule(
  eventAt: Date,
  isAllDay: boolean,
  now: Date
): { phase: ReminderPhase; nextNotifyAt: Date } {
  if (isAllDay) {
    const dayBefore = spDateAtTime(eventAt, -1, ALLDAY_BEFORE_HOUR, 0);
    const morning = spDateAtTime(eventAt, 0, ALLDAY_MORNING_HOUR, 0);
    if (now < dayBefore) return { phase: "pending", nextNotifyAt: dayBefore };
    if (now < morning) return { phase: "day_before", nextNotifyAt: morning };
    return { phase: "day_before", nextNotifyAt: now };
  }
  const lead1 = addMinutes(eventAt, -LEAD_1_MIN);
  const lead2 = addMinutes(eventAt, -LEAD_2_MIN);
  if (now < lead1) return { phase: "pending", nextNotifyAt: lead1 };
  if (now < lead2) return { phase: "pre", nextNotifyAt: lead2 };
  if (now < eventAt) return { phase: "due", nextNotifyAt: eventAt };
  return { phase: "due", nextNotifyAt: now };
}

/**
 * Encerra a ocorrência atual: se recorrente, avança para a próxima data e
 * reinicia o ciclo; se único, marca como concluído.
 */
export function finishOccurrence(r: Reminder, now: Date): ReminderPatch {
  if (isRecurring(r)) {
    const anchor = new Date(r.recurAnchorAt ?? r.eventAt);
    // Fixo: avança na grade da série. Relativo: avança a partir de agora,
    // mas preservando dia-da-semana e hora canônicos da âncora.
    const base =
      r.recurMode === "relative"
        ? (() => {
            const a = toSpParts(anchor);
            const n = toSpParts(now);
            return fromSpParts(n.year, n.month, n.day, a.hour, a.minute);
          })()
        : anchor;
    const nextEventAt = computeNextOccurrence(
      base,
      r.recurInterval as number,
      r.recurUnit as NonNullable<Reminder["recurUnit"]>,
      r.recurWeekday
    );
    const sched = initialSchedule(nextEventAt, r.isAllDay, now);
    return {
      eventAt: nextEventAt,
      recurAnchorAt: nextEventAt,
      status: "active",
      phase: sched.phase,
      nextNotifyAt: sched.nextNotifyAt,
      notifyCount: 0,
      acknowledged: false,
      acknowledgedAt: null,
    };
  }
  return { status: "done", nextNotifyAt: null };
}

/** Decide a próxima ação de um lembrete vencido (função pura). */
export function decide(r: Reminder, now: Date): TickResult {
  return r.isAllDay ? decideAllDay(r, now) : decideTimed(r, now);
}

function decideTimed(r: Reminder, now: Date): TickResult {
  if (r.notifyCount >= r.maxNotify) {
    if (isRecurring(r)) {
      return { message: messages.recurAdvance(r.title), patch: finishOccurrence(r, now) };
    }
    return { message: messages.autoCancel(r.title), patch: { status: "cancelled", nextNotifyAt: null } };
  }

  const notifyCount = r.notifyCount + 1;
  switch (r.phase) {
    case "pending":
      return { message: messages.pre30(r.title), patch: { phase: "pre", nextNotifyAt: addMinutes(new Date(r.eventAt), -LEAD_2_MIN), notifyCount } };
    case "pre":
      return { message: messages.pre5(r.title), patch: { phase: "due", nextNotifyAt: new Date(r.eventAt), notifyCount } };
    case "due":
      return { message: messages.atTime(r.title), patch: { phase: "at", nextNotifyAt: addMinutes(now, NAG_INTERVAL_MIN), notifyCount } };
    default:
      return { message: messages.nag(r.title), patch: { phase: "nag", nextNotifyAt: addMinutes(now, NAG_INTERVAL_MIN), notifyCount } };
  }
}

function decideAllDay(r: Reminder, now: Date): TickResult {
  if (r.phase === "pending") {
    const morning = spDateAtTime(new Date(r.eventAt), 0, ALLDAY_MORNING_HOUR, 0);
    return {
      message: messages.dayBefore(r.title),
      patch: { phase: "day_before", nextNotifyAt: morning, notifyCount: r.notifyCount + 1 },
    };
  }
  return { message: messages.dayOf(r.title), patch: finishOccurrence(r, now) };
}
