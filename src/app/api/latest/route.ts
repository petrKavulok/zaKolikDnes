import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL missing' }, { status: 500 });

  let host: string;
  try { host = new URL(url).host; } catch { host = 'unparseable'; }

  const sql = neon(url);
  const count = await sql`SELECT COUNT(*)::int AS n FROM prices`;
  const rows = await sql`
    SELECT bulletin_id,
           to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url,
           imported_at::text AS imported_at
      FROM prices
     ORDER BY effective_date DESC
     LIMIT 1`;

  // Temporary: return debug info so we can see exactly what the function sees
  return NextResponse.json({
    debug: { host, urlLength: url.length, countResult: count, rowsLength: rows.length },
    row: rows[0] ?? null,
  });
}
