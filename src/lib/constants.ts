export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zakolikdnes.cz';

export const SITE_NAME = 'Za kolik dnes?';

export const SITE_DESCRIPTION =
  'Aktuální maximální ceny benzínu Natural 95 a nafty z Cenového věstníku Ministerstva financí ČR. Data se aktualizují každý pracovní den ve 14:05.';

/** Last day of the first Ministry of Finance fuel price regulation period (inclusive). */
export const REGULATION_ENDED_ISO = '2026-07-19';

/** First day of the resumed regulation (October 2026). */
export const REGULATION_RESUMED_ISO = '2026-10-01';
