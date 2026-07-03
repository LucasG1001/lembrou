import { describe, it, expect } from "vitest";
import { INITIAL_STATE, review } from "./flashcardScheduler.js";
import type { SchedulerState } from "./flashcardScheduler.js";
import { parseEventAt, toSpParts } from "../lib/dateUtils.js";

const NOW = parseEventAt("2026-07-02", "20:00");

function makeState(over: Partial<SchedulerState> = {}): SchedulerState {
  return { ...INITIAL_STATE, ...over };
}

describe("review good", () => {
  it("card novo vai para 1 dia mantendo o ease", () => {
    const r = review(makeState(), "good", NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.repetitions).toBe(1);
    expect(r.easeFactor).toBe(2.5);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 3, hour: 4, minute: 0 });
  });

  it("segunda revisão vai para 6 dias", () => {
    const r = review(makeState({ intervalDays: 1, repetitions: 1 }), "good", NOW);
    expect(r.intervalDays).toBe(6);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 8, hour: 4 });
  });

  it("terceira revisão multiplica pelo ease", () => {
    const r = review(makeState({ intervalDays: 6, repetitions: 2 }), "good", NOW);
    expect(r.intervalDays).toBe(15);
  });
});

describe("review easy", () => {
  it("card novo vai para 4 dias e sobe o ease", () => {
    const r = review(makeState(), "easy", NOW);
    expect(r.intervalDays).toBe(4);
    expect(r.easeFactor).toBe(2.65);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 6, hour: 4 });
  });

  it("card maduro cresce com bônus de facilidade", () => {
    const r = review(makeState({ intervalDays: 10, repetitions: 3 }), "easy", NOW);
    expect(r.intervalDays).toBe(Math.round(10 * 2.5 * 1.3));
    expect(r.easeFactor).toBe(2.65);
  });
});

describe("review hard", () => {
  it("card novo vai para 1 dia e derruba o ease", () => {
    const r = review(makeState(), "hard", NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.35);
  });

  it("card maduro cresce pouco mas sempre avança", () => {
    const r = review(makeState({ intervalDays: 10, repetitions: 3 }), "hard", NOW);
    expect(r.intervalDays).toBe(12);
    expect(r.easeFactor).toBe(2.35);
  });
});

describe("review again", () => {
  it("reseta repetições, soma lapso e volta em 10 minutos", () => {
    const state = makeState({ intervalDays: 15, repetitions: 3, lapses: 1 });
    const r = review(state, "again", NOW);
    expect(r.intervalDays).toBe(0);
    expect(r.repetitions).toBe(0);
    expect(r.lapses).toBe(2);
    expect(r.easeFactor).toBe(2.3);
    expect(r.nextReviewAt.getTime()).toBe(NOW.getTime() + 10 * 60 * 1000);
  });

  it("depois de errar, acertar volta para 1 dia", () => {
    const lapsed = review(makeState({ intervalDays: 15, repetitions: 3 }), "again", NOW);
    const r = review(lapsed, "good", NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.repetitions).toBe(1);
  });
});

describe("piso do ease", () => {
  it("ease nunca cai abaixo de 1.3", () => {
    let state = makeState({ easeFactor: 1.35 });
    state = review(state, "again", NOW);
    expect(state.easeFactor).toBe(1.3);
    state = review(state, "hard", NOW);
    expect(state.easeFactor).toBe(1.3);
  });

  it("com ease no piso os intervalos ainda crescem", () => {
    const r = review(makeState({ easeFactor: 1.3, intervalDays: 5, repetitions: 2 }), "good", NOW);
    expect(r.intervalDays).toBe(7);
  });
});

describe("normalização para 04:00 SP", () => {
  it("revisão às 23:30 vence no dia seguinte às 04:00", () => {
    const lateNight = parseEventAt("2026-07-02", "23:30");
    const r = review(makeState(), "good", lateNight);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 3, hour: 4, minute: 0 });
  });

  it("revisão às 01:00 vence no mesmo dia civil seguinte às 04:00", () => {
    const earlyMorning = parseEventAt("2026-07-03", "01:00");
    const r = review(makeState(), "good", earlyMorning);
    expect(toSpParts(r.nextReviewAt)).toMatchObject({ day: 4, hour: 4, minute: 0 });
  });
});
