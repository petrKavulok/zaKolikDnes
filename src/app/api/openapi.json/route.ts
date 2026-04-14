import { SITE_URL, SITE_NAME } from '@/lib/constants';

const spec = {
  openapi: '3.1.0',
  info: {
    title: `${SITE_NAME} API`,
    description:
      'Public API for current and historical maximum regulated fuel prices (Natural 95 gasoline and Diesel) in the Czech Republic. Data sourced from the Ministry of Finance Price Bulletin (Cenový věstník MF ČR). Updated Monday–Friday at 14:05 Prague time.',
    version: '1.0.0',
    contact: { name: 'Za kolik dnes?', url: SITE_URL },
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  },
  servers: [{ url: SITE_URL, description: 'Production' }],
  paths: {
    '/api/latest': {
      get: {
        operationId: 'getLatestPrice',
        summary: 'Get the current fuel price',
        description:
          'Returns the most recent maximum fuel price record. Prices are in CZK per liter, including VAT.',
        responses: {
          '200': {
            description: 'Current price record',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PriceRow' },
                example: {
                  bulletin_id: '9/2026',
                  effective_date: '2026-04-14',
                  gasoline_czk: 38.9,
                  diesel_czk: 36.5,
                  source_url: 'https://www.mfcr.cz/assets/cs/media/Cenovy-vestnik_2026-cv09.pdf',
                  imported_at: '2026-04-14T12:05:30.123456+00:00',
                },
              },
            },
          },
          '404': {
            description: 'No price data available yet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { error: { type: 'string' } },
                },
                example: { error: 'no data yet' },
              },
            },
          },
        },
      },
    },
    '/api/history': {
      get: {
        operationId: 'getPriceHistory',
        summary: 'Get price history (last 30 records)',
        description:
          'Returns the last 30 price records, sorted by effective date descending (newest first). Useful for charting price trends.',
        responses: {
          '200': {
            description: 'Array of price records',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PriceRow' },
                },
              },
            },
          },
        },
      },
    },
    '/feed.xml': {
      get: {
        operationId: 'getRssFeed',
        summary: 'RSS 2.0 feed of price updates',
        description: 'RSS feed with the last 30 price updates. Each item contains both fuel prices and a link to the source bulletin.',
        responses: {
          '200': {
            description: 'RSS 2.0 XML feed',
            content: { 'application/rss+xml': {} },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PriceRow: {
        type: 'object',
        required: ['bulletin_id', 'effective_date', 'gasoline_czk', 'diesel_czk', 'imported_at'],
        properties: {
          bulletin_id: {
            type: 'string',
            description: 'Czech Price Bulletin identifier',
            example: '9/2026',
          },
          effective_date: {
            type: 'string',
            format: 'date',
            description: 'Date from which prices apply (YYYY-MM-DD)',
            example: '2026-04-14',
          },
          gasoline_czk: {
            type: 'number',
            description: 'Maximum price of Natural 95 gasoline in CZK per liter',
            example: 38.9,
          },
          diesel_czk: {
            type: 'number',
            description: 'Maximum price of Diesel in CZK per liter',
            example: 36.5,
          },
          source_url: {
            type: ['string', 'null'],
            description: 'URL of the original bulletin PDF from mfcr.cz',
            example: 'https://www.mfcr.cz/assets/cs/media/Cenovy-vestnik_2026-cv09.pdf',
          },
          imported_at: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp of when the record was imported',
            example: '2026-04-14T12:05:30.123456+00:00',
          },
        },
      },
    },
  },
};

export function GET() {
  return Response.json(spec, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
