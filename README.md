# RemindMe

App pessoal (usuário único, sem auth) com duas áreas que compartilham o mesmo design:

- **Lembretes** — alertas de texto no Telegram e ações pelo app, com recorrência (fixa ou relativa à conclusão).
- **Hábitos** — tracking de hábitos com sequência (streak), níveis e grade de conclusões. **Sem notificações** (só acompanhamento).

A navegação entre as duas é feita por uma Sidebar (vira barra inferior no mobile). As duas páginas usam o mesmo visual de **linha do tempo** (agenda agrupada por dia/mês).

## Lembretes — como funcionam

- **Evento com hora** (ex: "Reunião 18/06 14:00"): avisa **30 min antes → 5 min antes → no horário** e depois de 10 em 10 min, até ~10 avisos no total (senão cancela sozinho). Criou perto do horário? Os marcos já vencidos são pulados — nada de avisos acumulados.
- **Evento sem hora = dia inteiro** (ex: "Dentista 14/06"): avisa **na véspera às 08:00** e **no dia às 08:00**.
- **Recorrência** — definida na criação/edição: **fixa** (sempre na mesma grade, ex: "toda segunda 10h") ou **relativa à conclusão** (ex: "a cada 6 meses aos sábados", recalculada a partir de quando você confirma). Ao concluir/encerrar uma ocorrência, a próxima é agendada.

As notificações do Telegram são **só texto** (sem botões) — todas as ações são feitas no app:

- **Toque** num lembrete abre uma folha de ações: **Concluir**, **Remarcar** (+1h/+3h/+1d/+1sem ou "Personalizado…") e **Cancelar**.
- **Pressionar e segurar (~500ms)** abre o formulário de **edição**.
- **Remarcar** move só **aquela ocorrência** (não desloca a série recorrente). Não dá para agendar no passado, nem remarcar um recorrente fixo para depois do próximo agendamento.

## Início (dashboard)

A rota `/inicio` é a tela inicial: saudação, resumo do dia e cartões de **Esta semana** (lembretes dos próximos 7 dias) e **Hábitos de hoje** (com nível e streak). No canto da saudação, um ícone de **calendário** abre um calendário mensal que mostra, em cada dia, um **badge** com a quantidade de lembretes agendados e destaca os **feriados** (nacionais, estadual SP e municipais de Indaiatuba), com a lista do mês embaixo. Os feriados são calculados no cliente em `utils/holidays.ts` (Páscoa/Computus + offsets), sem banco.

## Hábitos — como funcionam

- Cada hábito tem dias da semana agendados (`selectedDays`; o formulário tem o atalho **"Todos os dias"**). A página de Hábitos mostra os hábitos de **hoje**: quadradinhos para marcar a conclusão e, abaixo, a lista do dia (com o **nível** ao lado e um **risco** quando concluído).
- O clique no item abre um painel lateral com a grade mensal de conclusões, sequência atual/maior e ações de editar/excluir.
- `currentStreak`, `longestStreak` e `level` são **recalculados no cliente** (`utils/streakUtils.ts`, `utils/levelUtils.ts`); o backend só persiste hábitos e conclusões.

> Hábitos vieram do antigo projeto `done`, que foi descontinuado e fundido aqui. As notificações/worker do Telegram daquele projeto foram descartadas.

## Arquitetura

```
Browser → Caddy (proxy central, TLS) → Express (server :3333, serve SPA + API) → PostgreSQL
                                                  │
                                                  └──(só Lembretes: envia alerta de texto)──▶ notify-api :3334 ──▶ Telegram
```

> As notificações são **só texto** desde que as ações migraram para o app. O endpoint `/api/telegram/callback` (cliques de botão) continua existindo, mas está **dormente** (nenhum botão é mais enviado).

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
| `POST` | `/api/reminders/:id/reschedule` | remarcar (move só a ocorrência atual) |
| `POST` | `/api/telegram/callback` | repasse de cliques (notify-api) — **legado/dormente** |
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

O domínio é roteado pelo **proxy reverso central Caddy** (`caddy-docker-proxy`, stack `../media/proxy`), compartilhado por todos os projetos da VPS — não há um proxy próprio aqui. O `server` entra na rede `proxy-net` e declara labels `caddy`; o Caddy descobre o container e termina o TLS (ACME DNS-01 via Cloudflare). Por isso o `server` **não expõe porta no host**. Não há nginx: o próprio Express serve o SPA (build do frontend copiado para `backend/public` na imagem) e a API na porta 3333.

```bash
docker network create remindme-net      # uma vez (a notify-api também entra nessa rede)
docker network create proxy-net         # uma vez (compartilhada com o proxy central)
cp .env.example .env                     # preencha senha, NOTIFY_API_KEY, CALLBACK_SECRET, WEB_URL, REMINDME_DOMAIN
docker compose up --build                # acesse https://${REMINDME_DOMAIN} pela VPN
```

Crie o registro DNS de `REMINDME_DOMAIN` no Cloudflare apontando para a VPN.

## Variáveis de ambiente

| Var | Onde | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | backend | conexão PostgreSQL (banco `remindme`) |
| `NOTIFY_API_URL` | backend | base da notify-api (ex: `http://notify-api:3334`) |
| `NOTIFY_API_KEY` | backend | apiKey do projeto RemindMe na notify-api |
| `CALLBACK_SECRET` | backend + projeto notify-api | valida o repasse dos cliques (callback dormente) |
| `WEB_URL` | backend | URL pública do frontend (legado dos botões; não usado atualmente) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | compose | credenciais do container do banco |
| `REMINDME_DOMAIN` | compose | domínio servido pelo proxy Caddy (ex: `remind.gomeslab.tech`) |
