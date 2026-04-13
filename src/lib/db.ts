// Vercel Postgres wrapper.
//
// Dedup model:
//   * `bulletin_id` ("9/2026") is the canonical de-duplication key — it is
//     known *before* we download anything, so the orchestrator can skip
//     bulletins it has already processed without fetching the PDF.
//   * `effective_date` stays unique too (one bulletin = one effective date).
import { sql } from '@vercel/postgres';

export interface PriceRow {
  bulletin_id: string;
  effective_date: string; // ISO YYYY-MM-DD
  gasoline_czk: number;
  diesel_czk: number;
  source_url: string | null;
  imported_at: string;
}

// One-time schema bootstrap. Call from a migration script or a guarded admin
// route after first deploy — NOT on every cold start.
export async function ensureSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS prices (
      bulletin_id    TEXT PRIMARY KEY,
      effective_date DATE NOT NULL UNIQUE,
      gasoline_czk   REAL NOT NULL,
      diesel_czk     REAL NOT NULL,
      source_url     TEXT,
      imported_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prices_effective_date ON prices(effective_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prices_imported_at ON prices(imported_at)`;
}

export async function upsertPrice(row: {
  bulletin_id: string;
  effective_date: string;
  gasoline_czk: number;
  diesel_czk: number;
  source_url?: string | null;
}): Promise<{ inserted: boolean }> {
  const r = await sql`
    INSERT INTO prices (bulletin_id, effective_date, gasoline_czk, diesel_czk, source_url)
    VALUES (${row.bulletin_id}, ${row.effective_date}, ${row.gasoline_czk},
            ${row.diesel_czk}, ${row.source_url ?? null})
    ON CONFLICT (bulletin_id) DO NOTHING`;
  return { inserted: (r.rowCount ?? 0) > 0 };
}

export async function getLatest(): Promise<PriceRow | undefined> {
  const { rows } = await sql<PriceRow>`
    SELECT * FROM prices ORDER BY effective_date DESC LIMIT 1`;
  return rows[0];
}

export async function getHistory(limit = 30): Promise<PriceRow[]> {
  const { rows } = await sql<PriceRow>`
    SELECT * FROM prices ORDER BY effective_date DESC LIMIT ${limit}`;
  return rows;
}

/** Set of bulletin identifiers already in the database. */
export async function getKnownBulletinIds(): Promise<Set<string>> {
  const { rows } = await sql<{ bulletin_id: string }>`
    SELECT bulletin_id FROM prices WHERE bulletin_id IS NOT NULL`;
  return new Set(rows.map((r) => r.bulletin_id));
}
