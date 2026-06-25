import { httpRequest } from "../lib/httpClient.js";

export interface NotifyButton {
  text: string;
  url?: string;
  callbackData?: string;
}

export interface NotifyPayload {
  title: string;
  description: string;
  buttons?: NotifyButton[];
}

interface NotifyResponse {
  telegramMessageId?: string | null;
}

/**
 * Envia uma notificação pela notify-api (gateway do Telegram). Retorna o id da
 * mensagem no Telegram, ou null se a integração não estiver configurada / falhar.
 */
export async function sendNotification(payload: NotifyPayload): Promise<string | null> {
  const baseUrl = process.env.NOTIFY_API_URL;
  const apiKey = process.env.NOTIFY_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn("NOTIFY_API_URL/NOTIFY_API_KEY ausentes — notificação não enviada.");
    return null;
  }

  try {
    const data = await httpRequest<NotifyResponse>({
      method: "post",
      url: `${baseUrl}/api/notifications`,
      headers: { "x-api-key": apiKey },
      data: {
        type: "reminder",
        title: payload.title,
        description: payload.description,
        buttons: payload.buttons,
      },
    });

    return data?.telegramMessageId ?? null;
  } catch (error) {
    console.error(`[notify] falha ao enviar para ${baseUrl}/api/notifications:`, error);
    throw error;
  }
}
