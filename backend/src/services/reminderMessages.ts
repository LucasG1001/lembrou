import type { ReminderMessage } from "./reminderStateMachine.js";

/**
 * Mensagens das notificações. Tom leve e direto, em PT-BR. O título e a
 * descrição são montados aqui; os botões de ação são adicionados pelo scheduler.
 */

export function pre30(title: string): ReminderMessage {
  return {
    title: `⏰ Faltam 30 minutos`,
    description: `Daqui a pouco: ${title}. Bom momento pra se ajeitar e não sair correndo. 🙂`,
  };
}

export function pre5(title: string): ReminderMessage {
  return {
    title: `⏰ Faltam 5 minutos`,
    description: `Quase lá: ${title}. Já dá pra se preparar. 🙂`,
  };
}

export function atTime(title: string): ReminderMessage {
  return {
    title: `🔔 É agora!`,
    description: `Chegou a hora de ${title}. Abra o app pra concluir ou remarcar quando puder.`,
  };
}

export function nag(title: string): ReminderMessage {
  return {
    title: `👀 E aí, conseguiu?`,
    description: `Ainda lembrando de ${title}. Quando der, conclua ou remarque no app.`,
  };
}

export function autoCancel(title: string): ReminderMessage {
  return {
    title: `😴 Cansei de avisar`,
    description: `Te lembrei de ${title} várias vezes e ninguém respondeu, então cancelei por aqui. Se ainda precisar, é só reabrir no app.`,
  };
}

export function recurAdvance(title: string): ReminderMessage {
  return {
    title: `🔁 Fica pra próxima`,
    description: `Encerrei os lembretes de ${title} desta vez. Quando chegar a próxima data, eu te chamo de novo. 👋`,
  };
}

export function dayBefore(title: string): ReminderMessage {
  return {
    title: `📅 É amanhã!`,
    description: `Amanhã tem ${title}. Deixa tudo pronto hoje pra não ter correria. 😉`,
  };
}

export function dayOf(title: string): ReminderMessage {
  return {
    title: `🌅 Bom dia!`,
    description: `Hoje é dia de ${title}. Capricha! ✨`,
  };
}
