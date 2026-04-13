// Postgres wrapper — Neon serverless driver over HTTP. Works in Vercel
// Functions without a persistent connection pool; @vercel/postgres is
// deprecated in favour of direct drivers.
//
// Dedup model:
//   * `bulletin_id` ("9/2026") is the canonical de-duplication key — it is
//     known *before* we download anything, so the orchestrator can skip
//     bulletins it has already processed without fetching the PDF.
//   * `effective_date` stays unique too (one bulletin = one effective date).
//
// Client-construction pattern: `neon(process.env.DATABASE_URL!)` must be
// called *directly* inside each function — neither module-level nor
// helper-wrapped variants survive the production bundle (both silently
// return 0 rows, confirmed via an /api/diag endpoint). Likely an SWC/
// Turbopack quirk around tagged templates on call expressions. The neon
// driver is stateless HTTP, so per-call cost is nil.
import { neon } from '@neondatabase/serverless';

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
  const sql = neon(process.env.DATABASE_URL!);
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
  const sql = neon(process.env.DATABASE_URL!);
  // RETURNING + ON CONFLICT DO NOTHING: rows is non-empty iff a row was inserted.
  const rows = (await sql`
    INSERT INTO prices (bulletin_id, effective_date, gasoline_czk, diesel_czk, source_url)
    VALUES (${row.bulletin_id}, ${row.effective_date}, ${row.gasoline_czk},
            ${row.diesel_czk}, ${row.source_url ?? null})
    ON CONFLICT (bulletin_id) DO NOTHING
    RETURNING bulletin_id`) as unknown[];
  return { inserted: rows.length > 0 };
}

export async function getLatest(): Promise<PriceRow | undefined> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
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
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
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
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
    SELECT bulletin_id FROM prices WHERE bulletin_id IS NOT NULL`) as {
    bulletin_id: string;
  }[];
  return new Set(rows.map((r) => r.bulletin_id));
}
