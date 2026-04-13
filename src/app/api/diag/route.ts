// Temporary diagnostic endpoint — remove after debugging prod connection mismatch.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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
    const latest = (await sql`
      SELECT bulletin_id, effective_date::text, imported_at::text
        FROM prices ORDER BY effective_date DESC LIMIT 1
    `) as unknown[];
    return NextResponse.json({ host, rowCount: count[0]?.n, latest: latest[0] ?? null });
  } catch (err) {
    return NextResponse.json(
      { host, error: (err as Error).message },
      { status: 500 },
    );
  }
}
