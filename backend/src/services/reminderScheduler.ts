import * as reminderModel from "../models/reminderModel.js";
import type { Reminder } from "../types/reminder.js";
import { addMinutes } from "../lib/dateUtils.js";
import { encodeAck, encodeSnooze } from "../lib/callbackCodec.js";
import { decide, isRecurring } from "./reminderStateMachine.js";
import { sendNotification, type NotifyButton } from "./notifyService.js";

const TICK_MS = 60 * 1000;
const BATCH_LIMIT = 100;

let inFlight = false;

/** Monta os botões de ação de acordo com o tipo do lembrete e a WEB_URL. */
function buildButtons(r: Reminder): NotifyButton[] {
  const buttons: NotifyButton[] = [];

  if (r.isAllDay) {
    buttons.push({ text: isRecurring(r) ? "✅ Já resolvi" : "✅ Ok, ciente", callbackData: encodeAck(r.id) });
  } else {
    buttons.push({ text: "✅ Já estou no evento", callbackData: encodeAck(r.id) });
    buttons.push({ text: "⏰ +15 min", callbackData: encodeSnooze(15, r.id) });
    buttons.push({ text: "⏰ +30 min", callbackData: encodeSnooze(30, r.id) });
    buttons.push({ text: "⏰ +1 h", callbackData: encodeSnooze(60, r.id) });
  }

  const webUrl = process.env.WEB_URL?.trim();
  if (webUrl) {
    buttons.push({ text: "🗓 Outro horário", url: `${webUrl}/r/${r.id}?action=reschedule` });
    buttons.push({ text: "❌ Cancelar", url: `${webUrl}/r/${r.id}?action=cancel` });
  }

  return buttons;
}

export async function processDue(now: Date = new Date()): Promise<void> {
  const due = await reminderModel.findDue(now, BATCH_LIMIT);

  if (due.length > 0) {
    console.log(`[scheduler] ${now.toISOString()} — ${due.length} lembrete(s) a disparar.`);
  }

  for (const reminder of due) {
    try {
      const { message, patch, actionable } = decide(reminder, now);
      const buttons = actionable ? buildButtons(reminder) : undefined;
      const messageId = await sendNotification({ ...message, buttons });
      if (messageId === null) {
        console.warn(`[scheduler] lembrete ${reminder.id} ("${reminder.title}") processado sem id de mensagem (notify-api não configurada?).`);
      } else {
        console.log(`[scheduler] lembrete ${reminder.id} ("${reminder.title}") notificado: ${reminder.phase} → ${patch.phase ?? reminder.phase}.`);
      }
      await reminderModel.update(reminder.id, messageId ? { ...patch, lastMessageId: messageId } : patch);
    } catch (error) {
      console.error(`[scheduler] falha ao processar lembrete ${reminder.id} ("${reminder.title}"):`, error);
      // Não trava o lote: adia ~1 min mantendo a fase para tentar de novo.
      await reminderModel.update(reminder.id, { nextNotifyAt: addMinutes(now, 1) }).catch(() => undefined);
    }
  }
}

function tick(): void {
  if (inFlight) return;
  inFlight = true;
  processDue()
    .catch((error) => console.error("[scheduler] tick falhou:", error))
    .finally(() => {
      inFlight = false;
    });
}

export function startScheduler(): void {
  console.log("[scheduler] iniciado (tick a cada 60s).");
  tick();
  setInterval(tick, TICK_MS);
}
