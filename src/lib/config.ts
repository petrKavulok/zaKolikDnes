// Centralised, typed access to environment variables.
const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export const config = {
  sourceUrl: env('SOURCE_URL', 'https://www.https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/cenovy-vestnik'),
  adminToken: env('ADMIN_TOKEN', 'change-me'),
  cronSecret: env('CRON_SECRET', ''),
  // Acceptable price range in CZK/l. Used by validation.
  priceMin: 20,
  priceMax: 100,
};

export type AppConfig = typeof config;
