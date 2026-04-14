import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getLatest } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL missing' }, { status: 500 });

  // Inline (known to work)
  const sql = neon(url);
  const inline = await sql`
    SELECT bulletin_id, to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
           gasoline_czk, diesel_czk, source_url, imported_at::text AS imported_at
      FROM prices ORDER BY effective_date DESC LIMIT 1`;

  // Via @/lib/db (suspected broken)
  const shared = await getLatest();

  return NextResponse.json({
    inline: inline[0] ?? null,
    shared: shared ?? null,
  });
}
