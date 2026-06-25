import { describe, it, expect } from "vitest";
import { decide, initialSchedule, finishOccurrence } from "./reminderStateMachine.js";
import { parseEventAt, toSpParts } from "../lib/dateUtils.js";
import type { Reminder } from "../types/reminder.js";

const ID = "11111111-2222-4333-8444-555555555555";

function makeReminder(over: Partial<Reminder>): Reminder {
  return {
    id: ID,
    title: "Reunião",
    notes: null,
    eventAt: parseEventAt("2026-06-18", "14:00").toISOString(),
    isAllDay: false,
    recurInterval: null,
    recurUnit: null,
    recurWeekday: null,
    status: "active",
    phase: "pending",
    nextNotifyAt: null,
    notifyCount: 0,
    maxNotify: 10,
    acknowledged: false,
    acknowledgedAt: null,
    lastMessageId: null,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

describe("initialSchedule", () => {
  it("evento com hora no futuro começa 30 min antes", () => {
    const event = parseEventAt("2026-06-18", "14:00");
    const now = parseEventAt("2026-06-18", "10:00");
    const s = initialSchedule(event, false, now);
    expect(s.phase).toBe("pending");
    expect(toSpParts(s.nextNotifyAt)).toMatchObject({ hour: 13, minute: 30 });
  });

  it("evento de dia inteiro começa na véspera às 18:00", () => {
    const event = parseEventAt("2026-06-18", null);
    const now = parseEventAt("2026-06-10", null);
    const s = initialSchedule(event, true, now);
    expect(s.phase).toBe("pending");
    expect(toSpParts(s.nextNotifyAt)).toMatchObject({ day: 17, hour: 18 });
  });
});

describe("decide (com hora)", () => {
  it("pending → pre, incrementa contador", () => {
    const r = makeReminder({ phase: "pending", notifyCount: 0 });
    const { patch } = decide(r, new Date());
    expect(patch.phase).toBe("pre");
    expect(patch.notifyCount).toBe(1);
  });

  it("nag se repete a cada 10 min", () => {
    const now = new Date("2026-06-18T17:00:00.000Z");
    const r = makeReminder({ phase: "at", notifyCount: 3 });
    const { patch } = decide(r, now);
    expect(patch.phase).toBe("nag");
    expect(patch.nextNotifyAt?.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });

  it("cap atingido cancela evento único", () => {
    const r = makeReminder({ phase: "nag", notifyCount: 10, maxNotify: 10 });
    const { patch, actionable } = decide(r, new Date());
    expect(patch.status).toBe("cancelled");
    expect(patch.nextNotifyAt).toBeNull();
    expect(actionable).toBe(false);
  });

  it("cap atingido em evento recorrente avança para a próxima data", () => {
    const r = makeReminder({
      phase: "nag",
      notifyCount: 10,
      maxNotify: 10,
      recurInterval: 1,
      recurUnit: "week",
    });
    const { patch } = decide(r, new Date());
    expect(patch.status).toBe("active");
    expect(patch.notifyCount).toBe(0);
    expect(patch.eventAt).toBeInstanceOf(Date);
  });
});

describe("decide (dia inteiro)", () => {
  it("pending → day_before com disparo às 08:00 do dia", () => {
    const r = makeReminder({ isAllDay: true, eventAt: parseEventAt("2026-06-18", null).toISOString(), phase: "pending" });
    const { patch } = decide(r, new Date());
    expect(patch.phase).toBe("day_before");
    expect(toSpParts(patch.nextNotifyAt as Date)).toMatchObject({ day: 18, hour: 8 });
  });

  it("day_before encerra o evento único", () => {
    const r = makeReminder({ isAllDay: true, phase: "day_before" });
    const { patch } = decide(r, new Date());
    expect(patch.status).toBe("done");
    expect(patch.nextNotifyAt).toBeNull();
  });
});

describe("finishOccurrence", () => {
  it("recorrente reinicia ciclo na próxima data", () => {
    const r = makeReminder({ recurInterval: 6, recurUnit: "month", recurWeekday: 6, notifyCount: 5 });
    const patch = finishOccurrence(r, new Date());
    expect(patch.status).toBe("active");
    expect(patch.notifyCount).toBe(0);
    expect(patch.acknowledged).toBe(false);
  });

  it("único vira done", () => {
    const patch = finishOccurrence(makeReminder({}), new Date());
    expect(patch.status).toBe("done");
  });
});
