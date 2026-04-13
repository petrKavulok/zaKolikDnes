// Postgres wrapper — Neon serverless driver over HTTP. Works in Vercel
// Functions without a persistent connection pool; @vercel/postgres is
// deprecated in favour of direct drivers.
//
// Dedup model:
//   * `bulletin_id` ("9/2026") is the canonical de-duplication key — it is
//     known *before* we download anything, so the orchestrator can skip
//     bulletins it has already processed without fetching the PDF.
//   * `effective_date` stays unique too (one bulletin = one effective date).
import { neon } from '@neondatabase/serverless';

// Lazy client — instantiating `neon()` at module-load time was producing a
// client that returned no rows in prod (observed via /api/diag: identical
// `neon(process.env.DATABASE_URL)` calls returned different results depending
// on when they ran). Reading env + constructing the client per-call avoids
// any bundling/evaluation-order quirks and costs nothing (the driver is
// stateless HTTP).
function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export interface PriceRow {
  bulletin_id: string;
  effective_date: string; // ISO YYYY-MM-DD
  gasoline_czk: number;
  diesel_czk: number;
  source_url: string | null;
  imported_at: string;
}

// One-time schema bootstrap. Call from `npm run db:migrate` — NOT on every
// cold start.
export async function ensureSchema(): Promise<void> {
  await sqlClient()`
    CREATE TABLE IF NOT EXISTS prices (
      bulletin_id    TEXT PRIMARY KEY,
      effective_date DATE NOT NULL UNIQUE,
      gasoline_czk   REAL NOT NULL,
      diesel_czk     REAL NOT NULL,
      source_url     TEXT,
      imported_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sqlClient()`CREATE INDEX IF NOT EXISTS idx_prices_effective_date ON prices(effective_date)`;
  await sqlClient()`CREATE INDEX IF NOT EXISTS idx_prices_imported_at ON prices(imported_at)`;
}

export async function upsertPrice(row: {
  bulletin_id: string;
  effective_date: string;
  gasoline_czk: number;
  diesel_czk: number;
  source_url?: string | null;
}): Promise<{ inserted: boolean }> {
  // RETURNING + ON CONFLICT DO NOTHING: rows is non-empty iff a row was inserted.
  const rows = (await sqlClient()`
    INSERT INTO prices (bulletin_id, effective_date, gasoline_czk, diesel_czk, source_url)
    VALUES (${row.bulletin_id}, ${row.effective_date}, ${row.gasoline_czk},
            ${row.diesel_czk}, ${row.source_url ?? null})
    ON CONFLICT (bulletin_id) DO NOTHING
    RETURNING bulletin_id`) as unknown[];
  return { inserted: rows.length > 0 };
}

export async function getLatest(): Promise<PriceRow | undefined> {
  const rows = (await sqlClient()`
    SELECT bulletin_id,
           to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url,
           imported_at::text AS imported_at
      FROM prices
     ORDER BY effective_date DESC
     LIMIT 1`) as PriceRow[];
  return rows[0];
}

export async function getHistory(limit = 30): Promise<PriceRow[]> {
  const rows = (await sqlClient()`
    SELECT bulletin_id,
           to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url,
           imported_at::text AS imported_at
      FROM prices
     ORDER BY effective_date DESC
     LIMIT ${limit}`) as PriceRow[];
  return rows;
}

/** Set of bulletin identifiers already in the database. */
export async function getKnownBulletinIds(): Promise<Set<string>> {
  const rows = (await sqlClient()`
    SELECT bulletin_id FROM prices WHERE bulletin_id IS NOT NULL`) as {
    bulletin_id: string;
  }[];
  return new Set(rows.map((r) => r.bulletin_id));
}
