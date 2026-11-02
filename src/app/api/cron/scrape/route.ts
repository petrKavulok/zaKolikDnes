// Vercel Cron entry point. Scheduled in vercel.json.
//
// Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when the
// CRON_SECRET env var is set in the project. We verify it so the route can't
// be triggered by random callers. If CRON_SECRET is unset the check is skipped
// (Vercel then sends no header) — set it in the project to enable protection.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runScrape } from '@/scraper';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (config.cronSecret && req.headers.get('authorization') !== `Bearer ${config.cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runScrape();
    // Bust ISR cache so the home page and API routes serve fresh data immediately.
    revalidatePath('/');
    revalidatePath('/api/latest');
    revalidatePath('/api/history');
    return NextResponse.json(result);
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'cron scrape failed');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
