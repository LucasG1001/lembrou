import type { PoolClient } from "pg";
import { pool } from "./connection.js";

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateById<Row extends object>(
  table: string,
  id: string,
  sets: string[],
  values: unknown[],
  nextIndex: number
): Promise<Row | null> {
  if (sets.length === 0) {
    const existing = await pool.query<Row>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return existing.rows[0] ?? null;
  }
  sets.push("updated_at = NOW()");
  values.push(id);
  const result = await pool.query<Row>(
    `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${nextIndex} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}
