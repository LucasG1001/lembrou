import * as reminderModel from "../models/reminderModel.js";
import { decodeCallback } from "../lib/callbackCodec.js";
import { addMinutes } from "../lib/dateUtils.js";
import { finishOccurrence, isRecurring } from "./reminderStateMachine.js";

/**
 * Aplica um clique de botão (já decodificado a partir do callback_data) e
 * devolve o texto do toast a exibir no Telegram.
 */
export async function applyCallback(callbackData: string): Promise<{ toast: string }> {
  const action = decodeCallback(callbackData);
  if (!action) return { toast: "Ação não reconhecida." };

  const reminder = await reminderModel.findById(action.reminderId);
  if (!reminder || reminder.status !== "active") {
    return { toast: "Esse lembrete não está mais ativo." };
  }

  const now = new Date();

  if (action.type === "ack") {
    const patch = finishOccurrence(reminder, now);
    if (patch.status === "done") {
      patch.acknowledged = true;
      patch.acknowledgedAt = now;
    }
    await reminderModel.update(reminder.id, patch);
    return { toast: isRecurring(reminder) ? "Boa! Te aviso na próxima 👍" : "Combinado, não te encho mais 👍" };
  }

  // snooze: empurra o próximo disparo e consome uma das notificações.
  await reminderModel.update(reminder.id, {
    nextNotifyAt: addMinutes(now, action.minutes),
    notifyCount: reminder.notifyCount + 1,
  });
  return { toast: `Adiado ${action.minutes} min ⏰` };
}
