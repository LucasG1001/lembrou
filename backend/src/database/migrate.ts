import { pool } from "./connection.js";

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title             TEXT NOT NULL,
      notes             TEXT,
      event_at          TIMESTAMPTZ NOT NULL,
      is_all_day        BOOLEAN NOT NULL DEFAULT false,
      recur_interval    INTEGER,
      recur_unit        TEXT,
      recur_weekday     SMALLINT,
      recur_mode        TEXT NOT NULL DEFAULT 'fixed',
      recur_anchor_at   TIMESTAMPTZ,
      status            TEXT NOT NULL DEFAULT 'active',
      phase             TEXT NOT NULL DEFAULT 'pending',
      next_notify_at    TIMESTAMPTZ,
      notify_count      INTEGER NOT NULL DEFAULT 0,
      max_notify        INTEGER NOT NULL DEFAULT 10,
      acknowledged      BOOLEAN NOT NULL DEFAULT false,
      acknowledged_at   TIMESTAMPTZ,
      last_message_id   TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Recorrência: modo (fixo/relativo) e âncora da série, separada do event_at da ocorrência.
  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recur_mode TEXT NOT NULL DEFAULT 'fixed';
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recur_anchor_at TIMESTAMPTZ;
  `);

  // Backfill: linhas recorrentes legadas ancoram na ocorrência atual.
  await pool.query(`
    UPDATE reminders SET recur_anchor_at = event_at
      WHERE recur_anchor_at IS NULL AND recur_interval IS NOT NULL;
  `);

  // Consulta quente do scheduler: lembretes ativos com disparo vencido.
  await pool.query(`
    CREATE INDEX IF NOT EXISTS reminders_due_idx
      ON reminders (next_notify_at)
      WHERE status = 'active';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS habits (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            TEXT NOT NULL,
      selected_days   INTEGER[] NOT NULL,
      current_streak  INTEGER NOT NULL DEFAULT 0,
      longest_streak  INTEGER NOT NULL DEFAULT 0,
      level           INTEGER NOT NULL DEFAULT 1,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'target';
  `);

  await pool.query(`
    ALTER TABLE habits ALTER COLUMN icon SET DEFAULT 'target';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      completed   BOOLEAN NOT NULL DEFAULT TRUE,
      locked      BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE(habit_id, date)
    );
  `);
}
