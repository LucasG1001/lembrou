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

  // Ordem manual dos hábitos (drag-and-drop). Coluna idempotente.
  await pool.query(`
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
  `);

  // Backfill só quando ainda não há ordenação (todas as posições iguais): roda 1x.
  await pool.query(`
    UPDATE habits h SET position = s.rn
    FROM (SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at) - 1) AS rn FROM habits) s
    WHERE h.id = s.id AND (SELECT COUNT(DISTINCT position) FROM habits) <= 1;
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS board_lists (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS board_lists_project_idx ON board_lists (project_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      list_id     UUID NOT NULL REFERENCES board_lists(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      done        BOOLEAN NOT NULL DEFAULT FALSE,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS cards_list_idx ON cards (list_id);
  `);

  await pool.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS checklist TEXT NOT NULL DEFAULT '[]'`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question          TEXT NOT NULL,
      answer            TEXT NOT NULL,
      question_images   TEXT[] NOT NULL DEFAULT '{}',
      answer_images     TEXT[] NOT NULL DEFAULT '{}',
      tag               TEXT,
      ease_factor       REAL NOT NULL DEFAULT 2.5,
      interval_days     INTEGER NOT NULL DEFAULT 0,
      repetitions       INTEGER NOT NULL DEFAULT 0,
      lapses            INTEGER NOT NULL DEFAULT 0,
      next_review_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_reviewed_at  TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS flashcards_due_idx ON flashcards (next_review_at);
  `);
}
