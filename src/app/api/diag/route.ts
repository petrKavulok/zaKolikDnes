// Temporary diagnostic endpoint — remove after debugging prod connection mismatch.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getLatest } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL is not set at runtime' }, { status: 500 });
  }
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return 'unparseable';
    }
  })();

  try {
    const sql = neon(url);
    const count = (await sql`SELECT COUNT(*)::int AS n FROM prices`) as { n: number }[];
    // Replicate the EXACT query from getLatest() in src/lib/db.ts
    const latestExact = (await sql`
      SELECT bulletin_id,
             to_char(effective_date, 'YYYY-MM-DD') AS effective_date,
             gasoline_czk, diesel_czk, source_url,
             imported_at::text AS imported_at
        FROM prices
       ORDER BY effective_date DESC
       LIMIT 1`) as unknown[];
    // Call the shared helper via a static import (not dynamic)
    const viaShared = await getLatest();
    return NextResponse.json({
      host,
      rowCount: count[0]?.n,
      latestExact: latestExact[0] ?? null,
      viaShared: viaShared ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { host, error: (err as Error).message },
      { status: 500 },
    );
  }
}
