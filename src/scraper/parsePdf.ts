// Extract gasoline (Natural 95 / Benzín) and diesel (Nafta) max prices from a
// Cenový věstník PDF. Strategy: pull text via pdf-parse, then run regex
// heuristics tolerant to whitespace and Czech diacritics.
import pdfParse from 'pdf-parse';
import { logger } from '@/lib/logger';
import { ParsedPrices, parseCzechDate, parseCzechNumber } from './validate';

// Price format in the Czech daily bulletins: "41,95 Kč s DPH / litr".
// We anchor on the "Kč" unit because a bare "41,95" could be anything.
// Tolerant of extra whitespace and optional "s DPH" / "za litr" variants.
const PRICE_WITH_UNIT_RE =
  /(\d{1,3}(?:[\s.]\d{3})*[,.]\d{1,2})\s*Kč(?:\s*(?:s\s*DPH)?\s*(?:\/|za)\s*l(?:itr)?)?/gi;

/**
 * Find the first "NN,NN Kč …" price that appears AFTER the first occurrence
 * of `keywordRe`. Returns null when either the keyword or a trailing price is
 * missing. The window is generous (2 KB) because these bulletins are tiny.
 */
function priceNear(text: string, keywordRe: RegExp): number | null {
  const m = text.match(keywordRe);
  if (!m || m.index == null) return null;
  const window = text.slice(m.index, m.index + 2000);
  // `matchAll` so we can skip false positives and pick the first in-range value.
  for (const hit of window.matchAll(PRICE_WITH_UNIT_RE)) {
    const n = parseCzechNumber(hit[1]);
    if (n != null && n >= 10 && n <= 200) return n;
  }
  return null;
}

export function extractPricesFromText(text: string): Partial<ParsedPrices> {
  // Normalise line breaks so regexes can scan freely.
  const flat = text.replace(/\s+/g, ' ');

  const gasoline =
    priceNear(flat, /natural\s*95/i) ??
    priceNear(flat, /benz[íi]n\s*(?:automobilov[ýy])?(?:\s*95)?/i);

  const diesel =
    priceNear(flat, /motorov[áa]\s*nafta/i) ??
    priceNear(flat, /\bnafta\b/i) ??
    priceNear(flat, /\bdiesel\b/i);

  // Effective date: usually "s účinností od 1. ledna 2026" or "platnost od …".
  // Allow dots in the window — Czech dates themselves contain dots ("1. ledna 2026").
  const dateContext =
    flat.match(/(?:[úu]činnost[íi]?|platnost[íi]?)\s*od\s+.{0,80}/i)?.[0] ?? flat;
  const effective_date = parseCzechDate(dateContext) ?? undefined;

  if (gasoline == null || diesel == null) {
    // DEBUG: dump a snippet so we can see what the doc actually contains.
    // Tries to find a fuel-ish window first, falls back to the head of the doc.
    const fuelHit = flat.match(/.{0,80}(natural|benz[íi]n|nafta|diesel).{0,160}/i);
    // For short docs, dump the full text so we can calibrate the parser.
    const fullDump = flat.length <= 3500 ? flat : null;
    logger.warn(
      {
        textLen: flat.length,
        gasolineFound: gasoline,
        dieselFound: diesel,
        snippet: fuelHit ? fuelHit[0] : flat.slice(0, 400),
        snippetKind: fuelHit ? 'fuel-keyword-window' : 'doc-head',
        fullText: fullDump,
      },
      'extractPricesFromText: incomplete extraction',
    );
  }

  return {
    gasoline_czk: gasoline ?? undefined,
    diesel_czk: diesel ?? undefined,
    effective_date,
  };
}

export async function parsePdfBuffer(buf: Buffer): Promise<Partial<ParsedPrices>> {
  const { text } = await pdfParse(buf);
  return extractPricesFromText(text);
}
