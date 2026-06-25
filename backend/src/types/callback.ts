/** Ação decodificada a partir do callback_data de um botão. */
export type CallbackAction =
  | { type: "ack"; reminderId: string }
  | { type: "snooze"; minutes: number; reminderId: string };

/** Corpo repassado pela notify-api quando um botão é clicado. */
export interface TelegramCallback {
  callbackData: string;
  callbackQueryId: string;
  chatId: string;
  messageId: number | null;
  from: { id?: number; first_name?: string; username?: string } | null;
}
