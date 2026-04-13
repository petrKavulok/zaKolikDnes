// Scraper orchestrator.
//
// Strategy: enumerate every bulletin currently advertised on the index page,
// diff against bulletin_ids already in the database, and process only the
// unseen ones. This is robust to:
//   * missing/skipped bulletin numbers,
//   * the app being offline for several days,
//   * out-of-order publication.
//
// Per bulletin: download PDF → parse → on failure fall back to HTML →
// validate → upsert. Failures on individual bulletins are logged and do not
// abort the whole run.
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { fetchWithRetry } from '@/lib/http';
import { upsertPrice, getKnownBulletinIds } from '@/lib/db';
import { discoverBulletins, resolvePdfFromDetail, BulletinRef } from './source';
import { parsePdfBuffer } from './parsePdf';
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

async function processBulletin(ref: BulletinRef): Promise<BulletinResult> {
  let parsed: Partial<ParsedPrices> | undefined;
  let usedSource: string | undefined;

  if (ref.pdfUrl) {
    try {
      const pdf = await fetchWithRetry<ArrayBuffer>(ref.pdfUrl, { responseType: 'arraybuffer' });
      parsed = await parsePdfBuffer(Buffer.from(pdf.data));
      usedSource = ref.pdfUrl;
    } catch (err) {
      logger.warn(
        { id: ref.id, err: (err as Error).message },
        'pdf parsing failed, will try HTML',
      );
    }
  }

  if ((!parsed || !parsed.gasoline_czk || !parsed.diesel_czk) && ref.htmlUrl) {
    const html = await fetchWithRetry<string>(ref.htmlUrl, { responseType: 'text' });
    parsed = parseHtml(html.data);
    usedSource = ref.htmlUrl;
  }

  if (!parsed) return { id: ref.id, ok: false, error: 'no parser succeeded' };

  try {
    const validated = validatePrices(parsed);
    await upsertPrice({
      bulletin_id: ref.id,
      effective_date: validated.effective_date,
      gasoline_czk: validated.gasoline_czk,
      diesel_czk: validated.diesel_czk,
      source_url: usedSource ?? null,
    });
    return { id: ref.id, ok: true, prices: validated, source: usedSource };
  } catch (err) {
    return { id: ref.id, ok: false, error: (err as Error).message };
  }
}

export async function runScrape(): Promise<ScrapeResult> {
  const startedAt = Date.now();
  const all = await discoverBulletins(config.sourceUrl);
  const known = await getKnownBulletinIds();
  const fresh = all.filter((b) => !known.has(b.id));

  logger.info(
    { discovered: all.length, alreadyKnown: all.length - fresh.length, fresh: fresh.length },
    'discovered bulletins',
  );

  const processed: BulletinResult[] = [];
  // Process oldest fresh first so the chart fills in chronological order if
  // we're catching up from a gap.
  for (const ref of [...fresh].reverse()) {
    // Resolve the actual PDF link from the bulletin's detail page if the
    // index page didn't already expose one. Done lazily (only for bulletins
    // we're about to process) to avoid an extra fetch per known bulletin.
    const resolved = await resolvePdfFromDetail(ref);
    const res = await processBulletin(resolved);
    processed.push(res);
    if (res.ok) {
      logger.info({ id: res.id, prices: res.prices, source: res.source }, 'bulletin stored');
    } else {
      logger.warn({ id: res.id, error: res.error }, 'bulletin skipped');
    }
  }

  logger.info(
    {
      discovered: all.length,
      alreadyKnown: all.length - fresh.length,
      attempted: processed.length,
      stored: processed.filter((p) => p.ok).length,
      durationMs: Date.now() - startedAt,
    },
    'scrape complete',
  );

  return {
    ok: true,
    discovered: all.length,
    alreadyKnown: all.length - fresh.length,
    processed,
  };
}
