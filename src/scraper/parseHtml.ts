// HTML fallback parser. Strips markup with cheerio and reuses the same
// text-level extractor as the PDF parser so the heuristics stay in one place.
import * as cheerio from 'cheerio';
import { ParsedPrices } from './validate';
import { extractPricesFromText } from './parsePdf';

export function parseHtml(html: string): Partial<ParsedPrices> {
  const $ = cheerio.load(html);
  // Drop scripts/styles, then read visible text.
  $('script, style, noscript').remove();
  const text = $('body').text();
  return extractPricesFromText(text);
}
