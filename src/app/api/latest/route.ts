import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import type { PriceRow } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
    SELECT bulletin_id,
           to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url,
           imported_at::text AS imported_at
      FROM prices
     ORDER BY effective_date DESC
     LIMIT 1`) as PriceRow[];
  if (!rows[0]) return NextResponse.json({ error: 'no data yet' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
