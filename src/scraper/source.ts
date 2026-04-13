// Enumerate ALL bulletins listed on the configured index page.
//
// Two-stage discovery:
//   1. Index page → collect every anchor that looks like a bulletin ref
//      ("N/YYYY"). These typically point at the bulletin's HTML detail page
//      on mfcr.cz, not directly at a PDF.
//   2. For each detail page that has no PDF yet, fetch it and look for an
//      embedded PDF link. This is needed because mfcr.cz reorganised its
//      site so direct PDF links no longer appear on the category index.
//
// We let the orchestrator diff against the database to decide which bulletins
// to actually process, so the (more expensive) detail-page fetches only
// happen for bulletins that survived the diff.
import * as cheerio from 'cheerio';
import { fetchWithRetry } from '@/lib/http';
import { logger } from '@/lib/logger';

export interface BulletinRef {
  /** Canonical identifier, e.g. "9/2026". Used as the DB primary key. */
  id: string;
  /** Human-readable label as shown on the index page (best-effort). */
  label: string;
  /** PDF URL when the link points at a .pdf, or when a sibling .pdf is found. */
  pdfUrl?: string;
  /** HTML detail page URL (fallback parser source). */
  htmlUrl?: string;
}

const BULLETIN_RE = /cenov[yý]\s*v[eě]stn[ií]k|cenovy[_-]vestnik/i;
const ID_RE = /\b(\d{1,3})\s*\/\s*(\d{4})\b/;

function extractId(text: string, href: string): string | null {
  const m = text.match(ID_RE) ?? href.match(ID_RE);
  if (!m) return null;
  return `${parseInt(m[1], 10)}/${m[2]}`;
}

export async function discoverBulletins(indexUrl: string): Promise<BulletinRef[]> {
  const res = await fetchWithRetry<string>(indexUrl, { responseType: 'text' });
  const $ = cheerio.load(res.data);

  // Group anchors by bulletin id; for each id keep the best PDF + HTML URL.
  const byId = new Map<string, BulletinRef>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();

    // Must look like a bulletin reference somewhere.
    if (!BULLETIN_RE.test(href) && !BULLETIN_RE.test(text)) return;

    const id = extractId(text, href);
    if (!id) return;

    const abs = new URL(href, indexUrl).toString();
    const isPdf = abs.toLowerCase().endsWith('.pdf');

    const existing = byId.get(id) ?? { id, label: text };
    if (isPdf && !existing.pdfUrl) existing.pdfUrl = abs;
    if (!isPdf && !existing.htmlUrl) existing.htmlUrl = abs;
    if (!existing.label && text) existing.label = text;
    byId.set(id, existing);
  });

  if (byId.size === 0) {
    throw new Error(`No "Cenový věstník" bulletins discovered on ${indexUrl}`);
  }

  // Sort newest first: higher year wins, then higher number.
  return [...byId.values()].sort((a, b) => {
    const [an, ay] = a.id.split('/').map(Number);
    const [bn, by] = b.id.split('/').map(Number);
    return by - ay || bn - an;
  });
}

/**
 * Stage 2: given a bulletin whose only known URL is an HTML detail page, fetch
 * it and look for an embedded PDF link. Mutates and returns the ref. Failures
 * are logged but not thrown — the orchestrator can still try the HTML parser.
 */
export async function resolvePdfFromDetail(ref: BulletinRef): Promise<BulletinRef> {
  if (ref.pdfUrl || !ref.htmlUrl) return ref;

  try {
    const res = await fetchWithRetry<string>(ref.htmlUrl, { responseType: 'text' });
    const $ = cheerio.load(res.data);

    // Score each .pdf anchor: prefer ones whose URL or text mentions the
    // bulletin id, then ones that mention fuel keywords, then anything else.
    type Candidate = { url: string; score: number };
    const candidates: Candidate[] = [];
    const idForUrl = ref.id.replace('/', '-'); // common slug shape "N-YYYY"
    const idTokens = [ref.id, idForUrl, ref.id.replace('/', '_')];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (!href.toLowerCase().includes('.pdf')) return;
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const abs = new URL(href, ref.htmlUrl).toString();
      const haystack = `${abs} ${text}`.toLowerCase();

      let score = 1;
      if (idTokens.some((t) => haystack.includes(t.toLowerCase()))) score += 10;
      if (/cenov[yý].{0,3}v[eě]stn[ií]k/i.test(haystack)) score += 3;
      if (/benz[íi]n|nafta|natural|pohonn/i.test(haystack)) score += 2;
      candidates.push({ url: abs, score });
    });

    if (candidates.length === 0) {
      logger.warn({ id: ref.id, htmlUrl: ref.htmlUrl }, 'no PDF link found on detail page');
      return ref;
    }

    candidates.sort((a, b) => b.score - a.score);
    ref.pdfUrl = candidates[0].url;
    logger.info(
      { id: ref.id, pdfUrl: ref.pdfUrl, candidates: candidates.length },
      'resolved PDF from detail page',
    );
  } catch (err) {
    logger.warn(
      { id: ref.id, htmlUrl: ref.htmlUrl, err: (err as Error).message },
      'detail-page fetch failed',
    );
  }
  return ref;
}
