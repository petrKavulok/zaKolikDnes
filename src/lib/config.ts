// Centralised, typed access to environment variables.
const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export const config = {
  // Not env-overridable: the parser is written for this specific page. A stale
  // SOURCE_URL on Vercel (old bulletin index) silently broke scraping in Oct 2026.
  sourceUrl: 'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/maximalni-pripustne-ceny-benzinu-a-nafty',
  adminToken: env('ADMIN_TOKEN', 'change-me'),
  cronSecret: env('CRON_SECRET', ''),
  // Acceptable price range in CZK/l. Used by validation.
  priceMin: 20,
  priceMax: 100,
};

export type AppConfig = typeof config;
