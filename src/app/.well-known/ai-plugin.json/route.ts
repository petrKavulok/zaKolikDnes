import { SITE_URL } from '@/lib/constants';

export function GET() {
  return Response.json(
    {
      schema_version: 'v1',
      name_for_human: 'Za kolik dnes? – Czech Fuel Prices',
      name_for_model: 'czech_fuel_prices',
      description_for_human:
        'Current maximum regulated fuel prices (Natural 95 and Diesel) in the Czech Republic from the Ministry of Finance.',
      description_for_model:
        'Get current and historical maximum regulated fuel prices (Natural 95 gasoline and Diesel) in the Czech Republic. Prices are from the official Ministry of Finance Price Bulletin (Cenový věstník MF ČR), in CZK per liter including VAT. Data updates Monday–Friday at 14:05 Prague time. Use GET /api/latest for the current price and GET /api/history for the last 30 records.',
      api: {
        type: 'openapi',
        url: `${SITE_URL}/api/openapi.json`,
      },
      auth: { type: 'none' },
      logo_url: `${SITE_URL}/og-image.png`,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
