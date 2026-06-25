import { describe, it, expect } from "vitest";
import { encodeAck, encodeSnooze, decodeCallback } from "./callbackCodec.js";

const ID = "11111111-2222-4333-8444-555555555555";

describe("callbackCodec", () => {
  it("faz roundtrip de ack", () => {
    expect(decodeCallback(encodeAck(ID))).toEqual({ type: "ack", reminderId: ID });
  });

  it("faz roundtrip de snooze", () => {
    expect(decodeCallback(encodeSnooze(15, ID))).toEqual({ type: "snooze", minutes: 15, reminderId: ID });
    expect(decodeCallback(encodeSnooze(30, ID))).toEqual({ type: "snooze", minutes: 30, reminderId: ID });
    expect(decodeCallback(encodeSnooze(60, ID))).toEqual({ type: "snooze", minutes: 60, reminderId: ID });
  });

  it("respeita o limite de 64 bytes do Telegram", () => {
    expect(Buffer.byteLength(encodeSnooze(30, ID))).toBeLessThanOrEqual(64);
    expect(Buffer.byteLength(encodeAck(ID))).toBeLessThanOrEqual(64);
  });

  it("rejeita dados inválidos", () => {
    expect(decodeCallback("ack:nao-eh-uuid")).toBeNull();
    expect(decodeCallback("semseparador")).toBeNull();
    expect(decodeCallback(`xpto:${ID}`)).toBeNull();
  });
});
