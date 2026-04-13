// Tests for the text-level extractor (the part of the PDF parser that doesn't
// need pdf-parse). Covers a realistic Czech bulletin layout, format variants,
// and a malformed input that must NOT yield false-positive prices.
import { describe, expect, it } from 'vitest';
import { extractPricesFromText } from '../src/scraper/parsePdf';
import { validatePrices, ValidationError } from '../src/scraper/validate';

const REALISTIC = `
CENOVÝ VĚSTNÍK 12/2026

Ministerstvo financí stanoví s účinností od 1. ledna 2026 tyto maximální ceny:

Benzín automobilový Natural 95 ............ 38,90 Kč/l
Motorová nafta ............................ 36,50 Kč/l

Vydáno v Praze dne 20. prosince 2025.
`;

const ALT_FORMAT = `Cenový věstník — platnost od 15.03.2026
Natural 95: 41,20 Kč/l
Nafta: 39,75 Kč/l`;

const MALFORMED = `Tento dokument neobsahuje žádné ceny pohonných hmot.`;

describe('extractPricesFromText', () => {
  it('extracts gasoline, diesel and effective date from a realistic layout', () => {
    const out = extractPricesFromText(REALISTIC);
    expect(out.gasoline_czk).toBe(38.9);
    expect(out.diesel_czk).toBe(36.5);
    expect(out.effective_date).toBe('2026-01-01');
  });

  it('handles short alternative format with numeric date', () => {
    const out = extractPricesFromText(ALT_FORMAT);
    expect(out.gasoline_czk).toBe(41.2);
    expect(out.diesel_czk).toBe(39.75);
    expect(out.effective_date).toBe('2026-03-15');
  });

  it('returns undefined fields for malformed input and validation rejects it', () => {
    const out = extractPricesFromText(MALFORMED);
    expect(out.gasoline_czk).toBeUndefined();
    expect(out.diesel_czk).toBeUndefined();
    expect(() => validatePrices(out)).toThrow(ValidationError);
  });
});
