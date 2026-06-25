// Migra os hábitos do projeto "done" para o banco do remindMe.
//
// Uso (na VPS, com acesso aos dois bancos):
//   DONE_DATABASE_URL="postgresql://user:pass@host:5432/done" \
//   DATABASE_URL="postgresql://user:pass@host:5432/remindme" \
//   node scripts/migrate-habits-from-done.mjs
//
// Pré-requisito: o remindMe já deve ter rodado o migrate() de startup pelo
// menos uma vez (tabelas habits/habit_completions existem). Idempotente:
// pode ser executado mais de uma vez sem duplicar (ON CONFLICT DO NOTHING).
// UUIDs são preservados.

import pg from "pg";

const doneUrl = process.env.DONE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;

if (!doneUrl || !targetUrl) {
  console.error("Defina DONE_DATABASE_URL (origem) e DATABASE_URL (remindMe).");
  process.exit(1);
}

const source = new pg.Pool({ connectionString: doneUrl });
const target = new pg.Pool({ connectionString: targetUrl });

async function main() {
  const habits = await source.query(
    `SELECT id, name, selected_days, current_streak, longest_streak, level, created_at, updated_at
       FROM habits`
  );

  let insertedHabits = 0;
  for (const h of habits.rows) {
    const res = await target.query(
      `INSERT INTO habits
         (id, name, selected_days, current_streak, longest_streak, level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        h.id,
        h.name,
        h.selected_days,
        h.current_streak,
        h.longest_streak,
        h.level,
        h.created_at,
        h.updated_at,
      ]
    );
    insertedHabits += res.rowCount ?? 0;
  }

  const completions = await source.query(
    `SELECT id, habit_id, date, completed, locked FROM habit_completions`
  );

  let insertedCompletions = 0;
  for (const c of completions.rows) {
    const res = await target.query(
      `INSERT INTO habit_completions (id, habit_id, date, completed, locked)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (habit_id, date) DO NOTHING`,
      [c.id, c.habit_id, c.date, c.completed, c.locked]
    );
    insertedCompletions += res.rowCount ?? 0;
  }

  console.log(
    `Hábitos: ${habits.rowCount} na origem, ${insertedHabits} inseridos.\n` +
      `Conclusões: ${completions.rowCount} na origem, ${insertedCompletions} inseridas.`
  );
}

main()
  .catch((err) => {
    console.error("Falha na migração:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.end();
    await target.end();
  });
