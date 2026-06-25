import type { CallbackAction } from "../types/callback.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SNOOZE_MINUTES: Record<string, number> = { s15: 15, s30: 30, s60: 60 };

/**
 * callback_data do Telegram tem limite de 64 bytes. Usamos "<ação>:<uuid>",
 * que no pior caso (s30:<36 chars>) dá 40 bytes.
 */
export function encodeAck(reminderId: string): string {
  return `ack:${reminderId}`;
}

export function encodeSnooze(minutes: 15 | 30 | 60, reminderId: string): string {
  return `s${minutes}:${reminderId}`;
}

export function decodeCallback(data: string): CallbackAction | null {
  const sep = data.indexOf(":");
  if (sep === -1) return null;

  const action = data.slice(0, sep);
  const reminderId = data.slice(sep + 1);
  if (!UUID_RE.test(reminderId)) return null;

  if (action === "ack") return { type: "ack", reminderId };

  const minutes = SNOOZE_MINUTES[action];
  if (minutes) return { type: "snooze", minutes, reminderId };

  return null;
}
