import { describe, expect, it } from 'vitest';
import { validatePrices, ValidationError, parseCzechDate, parseCzechNumber } from '../src/scraper/validate';

describe('validatePrices', () => {
  it('accepts a well-formed record', () => {
    const out = validatePrices({
      effective_date: '2026-01-01',
      gasoline_czk: 38.9,
      diesel_czk: 36.5,
    });
    expect(out.gasoline_czk).toBe(38.9);
  });

  it('rejects out-of-range gasoline price', () => {
    expect(() =>
      validatePrices({ effective_date: '2026-01-01', gasoline_czk: 5, diesel_czk: 36.5 }),
    ).toThrow(ValidationError);
  });

  it('rejects out-of-range diesel price', () => {
    expect(() =>
      validatePrices({ effective_date: '2026-01-01', gasoline_czk: 38.9, diesel_czk: 999 }),
    ).toThrow(ValidationError);
  });

  it('rejects non-numeric prices', () => {
    expect(() =>
      validatePrices({
        effective_date: '2026-01-01',
        gasoline_czk: NaN,
        diesel_czk: 36.5,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects bad date format', () => {
    expect(() =>
      validatePrices({ effective_date: '01/01/2026', gasoline_czk: 38.9, diesel_czk: 36.5 }),
    ).toThrow(ValidationError);
  });
});

describe('parseCzechDate', () => {
  it('parses dotted numeric dates', () => {
    expect(parseCzechDate('platnost od 1.1.2026')).toBe('2026-01-01');
    expect(parseCzechDate('15.03.2026')).toBe('2026-03-15');
  });
  it('parses named-month Czech dates', () => {
    expect(parseCzechDate('s účinností od 1. ledna 2026')).toBe('2026-01-01');
    expect(parseCzechDate('20. prosince 2025')).toBe('2025-12-20');
  });
  it('returns null for unparseable input', () => {
    expect(parseCzechDate('někdy příští rok')).toBeNull();
  });
});

describe('parseCzechNumber', () => {
  it('parses comma decimal', () => {
    expect(parseCzechNumber('38,90')).toBe(38.9);
  });
  it('parses dot decimal', () => {
    expect(parseCzechNumber('38.90')).toBe(38.9);
  });
  it('returns null for garbage', () => {
    expect(parseCzechNumber('abc')).toBeNull();
  });
});
