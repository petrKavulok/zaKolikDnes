// Scraper orchestrator — direct-page edition.
//
// The Ministry of Finance now publishes regulated fuel price ceilings as a
// single HTML page updated every working day at 14:00 Prague time:
//   https://mf.gov.cz/cs/…/maximalni-pripustne-ceny-benzinu-a-nafty
//
// Strategy: fetch the page, parse the effective date and prices, then upsert
// into the database.  Multi-day bulletins (Friday → weekend+Mon) are handled
// naturally by the DB query: the stored effective_date is the first day of the
// valid period, and `WHERE effective_date <= today` finds the correct row on
// subsequent days.
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { fetchWithRetry } from '@/lib/http';
import { upsertPrice } from '@/lib/db';
import { parseHtml } from './parseHtml';
import { validatePrices, ParsedPrices } from './validate';

export interface BulletinResult {
  id: string;
  ok: boolean;
  prices?: ParsedPrices;
  source?: string;
  error?: string;
}

export interface ScrapeResult {
  ok: true;
  discovered: number;
  alreadyKnown: number;
  processed: BulletinResult[];
}

export async function runScrape(): Promise<ScrapeResult> {
  const startedAt = Date.now();

  const res = await fetchWithRetry<string>(config.sourceUrl, { responseType: 'text' });
  const parsed = parseHtml(res.data);
  const validated = validatePrices(parsed);

  const bulletinId = `direct/${validated.effective_date}`;
  const { inserted } = await upsertPrice({
    bulletin_id: bulletinId,
    effective_date: validated.effective_date,
    gasoline_czk: validated.gasoline_czk,
    diesel_czk: validated.diesel_czk,
    source_url: config.sourceUrl,
  });

  logger.info(
    {
      bulletinId,
      prices: validated,
      inserted,
      durationMs: Date.now() - startedAt,
    },
    inserted ? 'price stored' : 'already known',
  );

  return {
    ok: true,
    discovered: 1,
    alreadyKnown: inserted ? 0 : 1,
    processed: inserted
      ? [{ id: bulletinId, ok: true, prices: validated, source: config.sourceUrl }]
      : [],
  };
}
