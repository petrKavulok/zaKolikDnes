// Admin endpoint: manually trigger a scrape. Guarded by ADMIN_TOKEN passed in
// the `x-admin-token` header. Synchronous so the caller sees the result.
//
// This is a manual on-demand alternative to the scheduled /api/cron/scrape.
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { runScrape } from '@/scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (token !== config.adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runScrape();
    return NextResponse.json(result);
  } catch (err) {
    const msg = (err as Error).message;
    logger.error({ err: msg }, 'manual refresh failed');
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
