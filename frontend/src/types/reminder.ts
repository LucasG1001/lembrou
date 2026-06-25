export type ReminderStatus = "active" | "done" | "cancelled";

export type ReminderPhase = "pending" | "pre" | "at" | "nag" | "day_before" | "morning";

export type RecurUnit = "day" | "week" | "month" | "year";

export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  eventAt: string;
  isAllDay: boolean;
  recurInterval: number | null;
  recurUnit: RecurUnit | null;
  recurWeekday: number | null;
  status: ReminderStatus;
  phase: ReminderPhase;
  nextNotifyAt: string | null;
  notifyCount: number;
  maxNotify: number;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  lastMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderInput {
  title: string;
  notes: string | null;
  date: string;
  time: string | null;
  recurInterval: number | null;
  recurUnit: RecurUnit | null;
  recurWeekday: number | null;
  maxNotify?: number;
}
