import { SITE_URL } from '@/lib/constants';

export function GET() {
  const text = `# Za kolik dnes? — Full Documentation for AI Agents

> Current maximum regulated fuel prices (Natural 95 gasoline and Diesel) in the Czech Republic, sourced daily from the Ministry of Finance Price Bulletin (Cenový věstník MF ČR).

## Overview

This service tracks the official maximum retail fuel prices set by the Czech Ministry of Finance. These are legally binding price caps published in the Cenový věstník (Price Bulletin). The data covers two fuel types:

- **Natural 95** (unleaded gasoline, 95 octane) — referred to as "benzín" in Czech
- **Diesel** (motorová nafta) — standard automotive diesel

Prices are in **Czech crowns (CZK) per liter**, including VAT.

## API Endpoints

### GET ${SITE_URL}/api/latest

Returns the most recent price record.

**Response (200 OK):**
\`\`\`json
{
  "bulletin_id": "9/2026",
  "effective_date": "2026-04-14",
  "gasoline_czk": 38.90,
  "diesel_czk": 36.50,
  "source_url": "https://www.mfcr.cz/assets/cs/media/Cenovy-vestnik_2026-cvXX.pdf",
  "imported_at": "2026-04-14T12:05:30.123456+00:00"
}
\`\`\`

**Response (404):** \`{ "error": "no data yet" }\`

### GET ${SITE_URL}/api/history

Returns the last 30 price records, newest first.

**Response (200 OK):**
\`\`\`json
[
  {
    "bulletin_id": "9/2026",
    "effective_date": "2026-04-14",
    "gasoline_czk": 38.90,
    "diesel_czk": 36.50,
    "source_url": "https://www.mfcr.cz/...",
    "imported_at": "2026-04-14T12:05:30.123456+00:00"
  },
  ...
]
\`\`\`

### GET ${SITE_URL}/feed.xml

RSS 2.0 feed with the last 30 price updates. Each item contains the effective date, both fuel prices, and a link to the source bulletin.

### GET ${SITE_URL}/api/openapi.json

OpenAPI 3.1 specification for all public endpoints.

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| bulletin_id | string | Czech Price Bulletin identifier, e.g. "9/2026" |
| effective_date | string | Date from which prices apply (ISO 8601: YYYY-MM-DD) |
| gasoline_czk | number | Maximum price of Natural 95 gasoline in CZK per liter |
| diesel_czk | number | Maximum price of Diesel in CZK per liter |
| source_url | string or null | URL of the original PDF bulletin from mfcr.cz |
| imported_at | string | ISO 8601 timestamp of when the record was imported |

## Authentication

No authentication is required. All API endpoints are publicly accessible.

## Rate Limits

There are no explicit rate limits. However, data changes at most once per business day (Monday–Friday). Polling more frequently than once per hour provides no benefit.

## Update Schedule

- New prices are published by the Ministry of Finance on **business days (Monday–Friday) at 14:00 Prague time**
- This service imports new data at **14:05 Prague time** (CET = UTC+1 in winter, CEST = UTC+2 in summer)
- No updates occur on weekends or Czech public holidays
- API responses are cached for 1 hour with stale-while-revalidate

## Data Source

All data originates from the **Cenový věstník Ministerstva financí České republiky** (Price Bulletin of the Ministry of Finance of the Czech Republic):
https://www.https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik

## CORS

All API endpoints support CORS with \`Access-Control-Allow-Origin: *\`. You can call them directly from browser-based applications.

## Contact

Website: ${SITE_URL}
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
