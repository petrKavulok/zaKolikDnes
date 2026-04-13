// Validation for parsed price records. Rejects anything that isn't a real
// number in the expected CZK/l range, or a date we can't normalise.
import { config } from '@/lib/config';

export interface ParsedPrices {
  effective_date: string; // ISO YYYY-MM-DD
  gasoline_czk: number;
  diesel_czk: number;
}

export class ValidationError extends Error {}

function inRange(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= config.priceMin && n <= config.priceMax;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePrices(input: Partial<ParsedPrices>): ParsedPrices {
  if (!input.effective_date || !ISO_DATE.test(input.effective_date)) {
    throw new ValidationError(`invalid effective_date: ${input.effective_date}`);
  }
  if (!inRange(input.gasoline_czk)) {
    throw new ValidationError(`gasoline price out of range: ${input.gasoline_czk}`);
  }
  if (!inRange(input.diesel_czk)) {
    throw new ValidationError(`diesel price out of range: ${input.diesel_czk}`);
  }
  return input as ParsedPrices;
}

// Helpers usable by both PDF and HTML parsers.

const CZ_MONTHS: Record<string, number> = {
  ledna: 1, února: 2, unora: 2, března: 3, brezna: 3, dubna: 4, května: 5, kvetna: 5,
  června: 6, cervna: 6, července: 7, cervence: 7, srpna: 8, září: 9, zari: 9,
  října: 10, rijna: 10, listopadu: 11, prosince: 12,
};

/** Parse "1. ledna 2026" / "1.1.2026" / "01.01.2026" → "2026-01-01". */
export function parseCzechDate(text: string): string | null {
  const numeric = text.match(/\b(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\b/);
  if (numeric) {
    const [, d, m, y] = numeric;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const named = text
    .toLowerCase()
    .match(/\b(\d{1,2})\.\s*([a-záčďéěíňóřšťúůýž]+)\s+(\d{4})\b/);
  if (named) {
    const [, d, monthWord, y] = named;
    const m = CZ_MONTHS[monthWord];
    if (m) return `${y}-${String(m).padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/** Parse a Czech-formatted decimal ("32,40" or "32.40") as a number. */
export function parseCzechNumber(s: string): number | null {
  const cleaned = s.replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
