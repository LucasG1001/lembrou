# RemindMe

App pessoal (usuário único, sem auth) com duas áreas que compartilham o mesmo design:

- **Lembretes** — avisos no Telegram com botões de ação e recorrência.
- **Hábitos** — tracking de hábitos com sequência (streak), níveis e grade de conclusões. **Sem notificações** (só acompanhamento).

A navegação entre as duas é feita por uma Sidebar (vira barra inferior no mobile). As duas páginas usam o mesmo visual de **linha do tempo** (agenda agrupada por dia/mês).

## Lembretes — como funcionam

- **Evento com hora** (ex: "Reunião 18/06 14:00"): avisa 30 min antes → no horário → de 10 em 10 min até você tocar em **"Já estou no evento"**. No máximo 10 avisos (incluindo adiamentos), depois cancela sozinho.
- **Evento sem hora = dia inteiro** (ex: "Dentista 14/06"): aviso na véspera às 18:00 e outro às 08:00 no dia.
- **Recorrência** (ex: "a cada 6 meses aos sábados"): ao concluir uma ocorrência, agenda a próxima.

Cada notificação no Telegram traz botões: **✅ Já estou no evento**, **⏰ +15 / +30 / +1h** (adiar) e, se `WEB_URL` estiver configurada, **🗓 Outro horário** e **❌ Cancelar** (abrem a página web).

## Hábitos — como funcionam

- Cada hábito tem dias da semana agendados (`selectedDays`). A página de Hábitos mostra as **próximas ocorrências dos 7 dias** numa linha do tempo; marque a conclusão direto na linha.
- O clique no item abre um painel lateral com a grade mensal de conclusões, sequência atual/maior e ações de editar/excluir.
- `currentStreak`, `longestStreak` e `level` são **recalculados no cliente** (`utils/streakUtils.ts`, `utils/levelUtils.ts`); o backend só persiste hábitos e conclusões.

> Hábitos vieram do antigo projeto `done`, que foi descontinuado e fundido aqui. As notificações/worker do Telegram daquele projeto foram descartadas.

## Arquitetura

```
Browser → Nginx (web) → Express (server :3333) → PostgreSQL
                                  │
                                  ├──(só Lembretes: envia notificação)──▶ notify-api :3334 ──▶ Telegram
                                  ◀──(repassa clique de botão)── notify-api (long-polling getUpdates)
```

- **Domínios do backend** (mesmo padrão `types → models → schemas → controllers → routes`):
  - `reminders` — `/api/reminders` (+ scheduler de notificações e `/api/telegram/callback`).
  - `habits` — `/api/habits` (CRUD + `/:id/completion/:date`). Sem scheduler.
- A **notify-api** (`../notify-api`) é o gateway do Telegram (usada só pelos Lembretes). O RemindMe nunca fala com o Telegram diretamente.
- O **scheduler** (`setInterval` de 60s) varre lembretes vencidos; a lógica de transição fica em `services/reminderStateMachine.ts` (testada). Hábitos não passam pelo scheduler.
- O `migrate()` roda no startup e cria as tabelas de forma idempotente (`reminders`, `habits`, `habit_completions`).

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET/POST` | `/api/reminders` | listar / criar lembrete |
| `GET/PUT/DELETE` | `/api/reminders/:id` | ler / atualizar / remover |
| `POST` | `/api/reminders/:id/acknowledge` `\|` `/cancel` | concluir / cancelar |
| `POST` | `/api/telegram/callback` | repasse de cliques (notify-api) |
| `GET/POST` | `/api/habits` | listar / criar hábito |
| `PUT/DELETE` | `/api/habits/:id` | atualizar / remover |
| `PATCH` | `/api/habits/:id/completion/:date` | define status (`done\|notDone\|clear`) |

## Desenvolvimento local

Pré-requisitos: PostgreSQL acessível (banco `remindme`). A notify-api só é necessária para testar os avisos de Lembretes.

```bash
# backend
cd backend && cp .env.example .env   # ajuste DATABASE_URL, NOTIFY_API_*, CALLBACK_SECRET
npm install && npm run dev            # http://localhost:3333

# frontend
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxy /api → :3333)

# testes do backend
cd backend && npm test
```

## Migrar hábitos do antigo projeto `done` (uma vez)

Copia `habits` + `habit_completions` do banco do `done` para o do RemindMe (idempotente, preserva UUIDs):

```bash
cd backend
DONE_DATABASE_URL="postgresql://user:senha@host:5432/done" \
DATABASE_URL="postgresql://user:senha@host:5432/remindme" \
node scripts/migrate-habits-from-done.mjs
```

## Cadastrar o projeto na notify-api (para os Lembretes)

A notify-api precisa conhecer o RemindMe para enviar e repassar cliques. Crie o projeto via endpoint admin (a resposta traz a `apiKey` → use como `NOTIFY_API_KEY`):

```bash
curl -X POST http://localhost:3334/api/projects \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RemindMe",
    "telegramBotToken": "<bot-token>",
    "telegramChatId": "<chat-id>",
    "callbackUrl": "http://remindme-server:3333/api/telegram/callback",
    "callbackSecret": "<mesmo valor de CALLBACK_SECRET>"
  }'
```

- Em produção (Docker), `callbackUrl` usa o alias `remindme-server` na rede `remindme-net`.
- Em dev, use `http://localhost:3333/api/telegram/callback`.

## Produção (Docker)

O frontend é servido pelo **proxy reverso central Caddy** (`caddy-docker-proxy`, stack `../media/proxy`), compartilhado por todos os projetos da VPS — não há um proxy próprio aqui. O `web` entra na rede `proxy-net` e declara labels `caddy`; o Caddy descobre o container e termina o TLS (ACME DNS-01 via Cloudflare). Por isso o `web` **não expõe porta no host**.

```bash
docker network create remindme-net      # uma vez (a notify-api também entra nessa rede)
docker network create proxy-net         # uma vez (compartilhada com o proxy central)
cp .env.example .env                     # preencha senha, NOTIFY_API_KEY, CALLBACK_SECRET, WEB_URL, REMINDME_DOMAIN
docker compose up --build                # acesse https://${REMINDME_DOMAIN} pela VPN
```

Crie o registro DNS de `REMINDME_DOMAIN` no Cloudflare apontando para a VPN. Defina `WEB_URL=https://${REMINDME_DOMAIN}` para habilitar os botões de URL do Telegram.

## Variáveis de ambiente

| Var | Onde | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | backend | conexão PostgreSQL (banco `remindme`) |
| `NOTIFY_API_URL` | backend | base da notify-api (ex: `http://notify-api:3334`) |
| `NOTIFY_API_KEY` | backend | apiKey do projeto RemindMe na notify-api |
| `CALLBACK_SECRET` | backend + projeto notify-api | valida o repasse dos cliques |
| `WEB_URL` | backend | URL pública do frontend (botões de URL) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | compose | credenciais do container do banco |
| `REMINDME_DOMAIN` | compose | domínio servido pelo proxy Caddy (ex: `remind.gomeslab.tech`) |
