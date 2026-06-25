import { describe, it, expect } from "vitest";
import { parseEventAt, computeNextOccurrence, spDateAtTime, addMinutes, toSpParts } from "./dateUtils.js";

describe("parseEventAt", () => {
  it("interpreta data+hora como horário de São Paulo", () => {
    const d = parseEventAt("2026-06-18", "14:00");
    const p = toSpParts(d);
    expect(p).toMatchObject({ year: 2026, month: 5, day: 18, hour: 14, minute: 0 });
    // SP 14:00 = UTC 17:00
    expect(d.getUTCHours()).toBe(17);
  });

  it("evento sem hora vira meia-noite local", () => {
    const d = parseEventAt("2026-06-18", null);
    expect(toSpParts(d)).toMatchObject({ hour: 0, minute: 0, day: 18 });
  });
});

describe("spDateAtTime", () => {
  it("véspera às 18:00 e dia às 08:00", () => {
    const event = parseEventAt("2026-06-18", null);
    expect(toSpParts(spDateAtTime(event, -1, 18, 0))).toMatchObject({ day: 17, hour: 18 });
    expect(toSpParts(spDateAtTime(event, 0, 8, 0))).toMatchObject({ day: 18, hour: 8 });
  });
});

describe("computeNextOccurrence", () => {
  it("soma meses e encaixa no sábado", () => {
    const event = parseEventAt("2026-06-13", null); // sábado
    const next = computeNextOccurrence(event, 6, "month", 6);
    const p = toSpParts(next);
    expect(p.weekday).toBe(6);
    expect(p.month).toBe(11); // dezembro (jun + 6)
  });

  it("clampa fim de mês (31 jan + 1 mês = fev)", () => {
    const event = parseEventAt("2026-01-31", "09:00");
    const next = computeNextOccurrence(event, 1, "month", null);
    const p = toSpParts(next);
    expect(p.month).toBe(1); // fevereiro
    expect(p.day).toBe(28);
    expect(p.hour).toBe(9);
  });

  it("soma semanas preservando dia da semana", () => {
    const event = parseEventAt("2026-06-18", "10:00");
    const next = computeNextOccurrence(event, 2, "week", null);
    expect(toSpParts(next)).toMatchObject({ day: 2, month: 6, hour: 10 }); // 18 jun + 14 = 2 jul
  });

  it("soma anos", () => {
    const event = parseEventAt("2026-06-18", null);
    expect(toSpParts(computeNextOccurrence(event, 1, "year", null)).year).toBe(2027);
  });
});

describe("addMinutes", () => {
  it("desloca em minutos", () => {
    const base = new Date("2026-06-18T12:00:00.000Z");
    expect(addMinutes(base, 30).toISOString()).toBe("2026-06-18T12:30:00.000Z");
  });
});
