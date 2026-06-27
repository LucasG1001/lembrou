import * as reminderModel from "../models/reminderModel.js";
import { addMinutes } from "../lib/dateUtils.js";
import { decide } from "./reminderStateMachine.js";
import { sendNotification } from "./notifyService.js";

const TICK_MS = 60 * 1000;
const BATCH_LIMIT = 100;

let inFlight = false;

export async function processDue(now: Date = new Date()): Promise<void> {
  const due = await reminderModel.findDue(now, BATCH_LIMIT);

  if (due.length > 0) {
    console.log(`[scheduler] ${now.toISOString()} — ${due.length} lembrete(s) a disparar.`);
  }

  for (const reminder of due) {
    try {
      const { message, patch } = decide(reminder, now);
      // Notificação só com o alerta de texto — as ações agora são feitas pelo app.
      const messageId = await sendNotification({ ...message });
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
