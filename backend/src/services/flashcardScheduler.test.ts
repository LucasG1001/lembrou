import { describe, it, expect } from "vitest";
import { BOX_INTERVALS_DAYS, MAX_BOX, review } from "./flashcardScheduler.js";
import { parseEventAt, toSpParts } from "../lib/dateUtils.js";

const NOW = parseEventAt("2026-07-02", "20:00");

describe("Leitner acerto", () => {
  it("sobe uma caixa e agenda pelo intervalo da nova caixa", () => {
    const r = review(1, true, NOW);
    expect(r.box).toBe(2);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({
      day: 2 + BOX_INTERVALS_DAYS[1]!,
      hour: 4,
      minute: 0,
    });
  });

  it("respeita o teto da última caixa", () => {
    const r = review(MAX_BOX, true, NOW);
    expect(r.box).toBe(MAX_BOX);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({
      day: 2 + BOX_INTERVALS_DAYS[MAX_BOX - 1]!,
      hour: 4,
    });
  });
});

describe("Leitner erro", () => {
  it("volta para a caixa 1 independentemente da caixa atual", () => {
    const r = review(4, false, NOW);
    expect(r.box).toBe(1);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 2 + BOX_INTERVALS_DAYS[0]!, hour: 4 });
  });
});

describe("Leitner robustez", () => {
  it("normaliza caixas inválidas para 1 antes de avançar", () => {
    expect(review(0, true, NOW).box).toBe(2);
    expect(review(99, true, NOW).box).toBe(MAX_BOX);
  });
});

describe("normalização para 04:00 SP", () => {
  it("acerto às 23:30 vence às 04:00 do dia-alvo", () => {
    const lateNight = parseEventAt("2026-07-02", "23:30");
    const r = review(1, true, lateNight);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({
      day: 2 + BOX_INTERVALS_DAYS[1]!,
      hour: 4,
      minute: 0,
    });
  });

  it("acerto às 01:00 conta a partir do dia civil corrente", () => {
    const earlyMorning = parseEventAt("2026-07-03", "01:00");
    const r = review(1, true, earlyMorning);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({
      day: 3 + BOX_INTERVALS_DAYS[1]!,
      hour: 4,
      minute: 0,
    });
  });
});
