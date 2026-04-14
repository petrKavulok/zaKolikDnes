import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL missing' }, { status: 500 });
  const sql = neon(url);
  const rows = await sql`
    SELECT bulletin_id,
           to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url,
           imported_at::text AS imported_at
      FROM prices
     ORDER BY effective_date DESC
     LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: 'no data yet' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
