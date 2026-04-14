import { SITE_URL } from '@/lib/constants';

export function GET() {
  const text = `# Za kolik dnes?
> Current maximum regulated fuel prices (Natural 95 gasoline and Diesel) in the Czech Republic, sourced daily from the Ministry of Finance Price Bulletin (Cenový věstník MF ČR).

## Key Pages
- [Home](${SITE_URL}): Current Natural 95 and Diesel maximum prices with 30-day price history chart
- [Latest Price API](${SITE_URL}/api/latest): JSON endpoint returning the current price record
- [Price History API](${SITE_URL}/api/history): JSON endpoint returning the last 30 price records
- [RSS Feed](${SITE_URL}/feed.xml): Price updates as RSS 2.0 feed
- [OpenAPI Spec](${SITE_URL}/api/openapi.json): Full API documentation (OpenAPI 3.1)

## Preferred Content
- Current and historical maximum fuel prices (authoritative, government-sourced data)
- Price trend data and daily changes for Natural 95 and Diesel
- Official data from Cenový věstník Ministerstva financí ČR

## Data Format
Each price record contains: bulletin_id, effective_date (YYYY-MM-DD), gasoline_czk (CZK/l), diesel_czk (CZK/l), source_url, imported_at.

## Update Schedule
New prices are published Monday–Friday at 14:05 Prague time (CET/CEST). Data source: https://www.mfcr.cz/cs/legislativa/cenovy-vestnik
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
