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

const sql = neon(process.env.DATABASE_URL!);

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

export interface PriceContext {
  current: PriceRow | undefined;
  next: PriceRow | undefined;
  previous: PriceRow | undefined;
}

/** Fetch the price active on `today`, the next future price, and the previous price. */
export async function getPriceContext(today: string): Promise<PriceContext> {
  const rows = (await sql`
    (SELECT 'current' AS role, bulletin_id,
            to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
            gasoline_czk, diesel_czk, source_url,
            imported_at::text AS imported_at
       FROM prices
      WHERE effective_date <= ${today}::date
      ORDER BY effective_date DESC
      LIMIT 1)
    UNION ALL
    (SELECT 'next' AS role, bulletin_id,
            to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
            gasoline_czk, diesel_czk, source_url,
            imported_at::text AS imported_at
       FROM prices
      WHERE effective_date > ${today}::date
      ORDER BY effective_date ASC
      LIMIT 1)
    UNION ALL
    (SELECT 'previous' AS role, bulletin_id,
            to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
            gasoline_czk, diesel_czk, source_url,
            imported_at::text AS imported_at
       FROM prices
      WHERE effective_date < (
        SELECT effective_date FROM prices
         WHERE effective_date <= ${today}::date
         ORDER BY effective_date DESC LIMIT 1
      )
      ORDER BY effective_date DESC
      LIMIT 1)
  `) as (PriceRow & { role: string })[];

  const byRole = Object.fromEntries(rows.map((r) => [r.role, r]));
  return {
    current: byRole['current'],
    next: byRole['next'],
    previous: byRole['previous'],
  };
}

// ---------------------------------------------------------------------------
// Sleva click tracking
// ---------------------------------------------------------------------------

export async function ensureClicksSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sleva_clicks (
      id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      clicked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      source      TEXT NOT NULL DEFAULT 'main'
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sleva_clicks_clicked_at ON sleva_clicks(clicked_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS sleva_stats (
      id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      total_clicks  BIGINT NOT NULL DEFAULT 0
    )`;
  await sql`INSERT INTO sleva_stats (id, total_clicks) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`;
}

export async function recordSlevaClick(source: string = 'main'): Promise<void> {
  await sql`INSERT INTO sleva_clicks (source) VALUES (${source})`;
  await sql`UPDATE sleva_stats SET total_clicks = total_clicks + 1 WHERE id = 1`;
}

/** Set of bulletin identifiers already in the database. */
export async function getKnownBulletinIds(): Promise<Set<string>> {
  const rows = (await sql`
    SELECT bulletin_id FROM prices WHERE bulletin_id IS NOT NULL`) as {
    bulletin_id: string;
  }[];
  return new Set(rows.map((r) => r.bulletin_id));
}
