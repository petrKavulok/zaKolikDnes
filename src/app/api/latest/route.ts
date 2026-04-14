import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL missing' }, { status: 500 });
  const sql = neon(url);

  // Progressively complex queries to find where it breaks
  const q1 = await sql`SELECT COUNT(*)::int AS n FROM prices`;
  const q2 = await sql`SELECT bulletin_id FROM prices LIMIT 1`;
  const q3 = await sql`SELECT bulletin_id, effective_date FROM prices ORDER BY effective_date DESC LIMIT 1`;
  const q4 = await sql`SELECT bulletin_id, to_char(effective_date, 'YYYY-MM-DD') AS effective_date FROM prices ORDER BY effective_date DESC LIMIT 1`;
  const q5 = await sql`SELECT bulletin_id, to_char(effective_date, 'YYYY-MM-DD') AS effective_date, gasoline_czk, diesel_czk, source_url, imported_at::text AS imported_at FROM prices ORDER BY effective_date DESC LIMIT 1`;

  return NextResponse.json({ q1, q2, q3, q4, q5 });
}
