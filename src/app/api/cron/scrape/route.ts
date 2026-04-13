// Vercel Cron entry point. Scheduled in vercel.json.
//
// Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when the
// CRON_SECRET env var is set in the project. We verify it as a belt-and-braces
// check so the route can't be triggered by random callers.
import { NextRequest, NextResponse } from 'next/server';
import { runScrape } from '@/scraper';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Catch-up runs may iterate over several bulletins. >60s requires Pro plan.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runScrape();
    return NextResponse.json(result);
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'cron scrape failed');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
