# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar neste repositório.

## Visão geral

**RemindMe** é um app pessoal full-stack (usuário único, sem auth) com duas áreas que compartilham o mesmo design:

- **Lembretes** — avisos no Telegram com botões de ação e recorrência. Notificações enviadas via **notify-api** (gateway do Telegram); o RemindMe nunca fala com o Telegram diretamente.
- **Hábitos** — tracking de hábitos com streak, níveis e grade de conclusões. **Sem notificações.** (Domínio fundido do antigo projeto `done`, descontinuado.)

O frontend navega entre as duas por uma Sidebar (vira barra inferior no mobile) e ambas usam o mesmo componente de **linha do tempo** (`components/Timeline`, agrupada por dia/mês).

## Comandos de desenvolvimento

```bash
# backend (hot-reload via tsx)
cd backend && npm run dev        # http://localhost:3333
cd backend && npm run build      # tsc → dist/
cd backend && npm start          # node dist/server.js
cd backend && npm test           # vitest

# frontend (Vite)
cd frontend && npm run dev       # http://localhost:5173 (proxy /api → :3333)
cd frontend && npm run build     # tsc -b + vite build
cd frontend && npm run lint      # ESLint
```

Pré-requisito local: PostgreSQL acessível (banco `remindme`). A notify-api só é necessária para testar os avisos dos Lembretes.

## Arquitetura

### Fluxo de dados

```
Browser → Nginx (web) → Express (server :3333) → PostgreSQL
                                  │
                                  ├──(só Lembretes)──▶ notify-api :3334 ──▶ Telegram
                                  ◀──(repassa clique)── notify-api (long-polling)
```

O backend roda `migrate()` no startup (criação idempotente de `reminders`, `habits`, `habit_completions` — sem arquivos de migração).

### Backend (`backend/src/`)

Dois domínios, mesmo padrão em camadas: `types/` → `models/` (mapper `toX` snake→camel, queries parametrizadas) → `schemas/` (Zod) → `controllers/` (try/catch, valida com Zod, responde `{ error: "msg PT" }`) → `routes/` (Router + export nomeado).

- **`server.ts`** — Express, registra rotas (`/api/reminders`, `/api/habits`, `/api/telegram`), roda `migrate()` e inicia o scheduler de lembretes.
- **`database/connection.ts`** — pool pg (usa `DATABASE_URL`). **`database/migrate.ts`** — DDL idempotente.
- **Reminders**: `models/reminderModel.ts`, `controllers/reminderController.ts`, `services/reminderScheduler.ts` (setInterval 60s) e `services/reminderStateMachine.ts` (lógica de fases, testada). `lib/dateUtils.ts` isola o fuso (America/Sao_Paulo, UTC-3).
- **Habits**: `models/habitModel.ts` (inclui conclusões + `CompletionLockedError`), `controllers/habitController.ts`. Sem scheduler/notificações.
- **notify-api**: `services/notifyService.ts` + `controllers/callbackController.ts` (recebe cliques em `/api/telegram/callback`, validado por `middleware/callbackAuth.ts`).

### Frontend (`frontend/src/`)

- **`App.tsx`** — BrowserRouter + `Sidebar`; rotas `/lembretes`, `/lembretes/novo`, `/lembretes/r/:id`, `/habitos` (`/` redireciona para `/lembretes`).
- **`components/Sidebar/`** — navegação Lembretes/Hábitos (bottom-nav no mobile).
- **`components/Timeline/`** + **`utils/agenda.ts`** — linha do tempo genérica (`TimelineItem`, `splitAgenda`, `groupByDay`, `groupByMonth`) usada pelas duas páginas.
- **Lembretes**: `pages/RemindersPage` (timeline na aba Ativos + cards nas demais), `pages/ReminderFormPage`, `components/ReminderCard`, `hooks/useReminders.ts`, `services/reminderService.ts`, `utils/format.ts`.
- **Hábitos**: `pages/HabitsPage` (timeline de ocorrências + `SidePanel` + `HabitForm`), `hooks/useHabits.ts` (recalcula streak/level no cliente), `services/habitService.ts`, `utils/{dateUtils,streakUtils,levelUtils}.ts`, componentes `CompletionGrid`, `SidePanel`, `HabitForm`, `DaySelector`, `LevelBadge`.
- **`styles/global.css`** — CSS custom properties (tema escuro púrpura, fonte Inter). Inclui um bloco de **tokens de compatibilidade** que mapeia os nomes antigos do `done` (`--accent`, `--bg-*`, `--radius-card`, `--level-1..8`…) para o tema unificado, para os componentes portados.

### Endpoints

- `GET/POST /api/reminders`; `GET/PUT/DELETE /api/reminders/:id`; `POST /api/reminders/:id/acknowledge` e `/cancel`; `POST /api/telegram/callback`.
- `GET/POST /api/habits`; `PUT/DELETE /api/habits/:id`; `PATCH /api/habits/:id/toggle/:date`; `PATCH /api/habits/:id/completion/:date` (body `{ status: "done"|"notDone"|"clear" }`).

### Schema do banco

- **`reminders`** — lembrete com `event_at`, `is_all_day`, recorrência (`recur_*`), `status`, `phase`, `next_notify_at`, `notify_count`, `max_notify`, etc.
- **`habits`** — `id`, `name`, `selected_days INTEGER[]` (0–6), `current_streak`, `longest_streak`, `level`, timestamps.
- **`habit_completions`** — `habit_id` (FK cascade), `date TEXT` (YYYY-MM-DD), `completed`, `locked`, `UNIQUE(habit_id, date)`.

## Convenções

- **Idioma**: código (variáveis, tipos, arquivos) em inglês; textos ao usuário (erros de API, UI) em português.
- **TypeScript** strict nos dois lados. Backend `module: NodeNext` → **imports com extensão `.js`**. Frontend `moduleResolution: bundler` → sem extensão.
- **Estilo**: CSS Modules por componente, sem libs de UI. Sempre usar as variáveis do `global.css`, nunca hardcode de cores/tamanhos.
- **Estado**: só hooks do React (`useState`/`useEffect`/etc.) — sem Redux/Zustand.
- **Sem comentários** no código.
- **HTTP**: `201` create, `204` delete, `400` validação, `404` not found, `409` conflito (`CompletionLockedError`), `500` erro.

## Fuso horário

Lembretes usam fuso fixo America/Sao_Paulo isolado em `backend/src/lib/dateUtils.ts`. Hábitos usam a data local do dispositivo e gravam a chave `YYYY-MM-DD` (o backend só persiste a string) — consistente para clientes em SP.

## Variáveis de ambiente

Backend (`backend/.env`): `DATABASE_URL`, `PORT` (3333), `NOTIFY_API_URL`, `NOTIFY_API_KEY`, `CALLBACK_SECRET`, `WEB_URL`.

Docker (`.env`): `POSTGRES_USER/PASSWORD/DB`, `NOTIFY_API_KEY`, `CALLBACK_SECRET`, `WEB_URL`, `REMINDME_DOMAIN`.

## Produção (Docker) e proxy

O frontend é servido pelo **proxy reverso central Caddy** (`caddy-docker-proxy`, stack `../media/proxy`), **compartilhado por todos os projetos da VPS** — não há proxy próprio aqui. O serviço `web` entra na rede `proxy-net` e declara labels `caddy: ${REMINDME_DOMAIN}` / `caddy.reverse_proxy: "{{upstreams 80}}"`; o Caddy descobre o container e termina o TLS (ACME DNS-01 via Cloudflare). Por isso o `web` não expõe porta no host.

```bash
docker network create remindme-net   # compartilhada com a notify-api
docker network create proxy-net       # compartilhada com o proxy central
docker compose up --build             # https://${REMINDME_DOMAIN} pela VPN
```

Migração de dados do antigo `done`: `backend/scripts/migrate-habits-from-done.mjs` (ver README).

## Fluxo de trabalho

- Para tarefas que envolvam mais de um arquivo, apresente um plano e aguarde aprovação antes de editar.
- Tarefas simples (1 arquivo, mudança pequena) pode executar direto.
