import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import type { PriceRow } from '@/lib/db';

interface JsonLdProps {
  current: PriceRow | undefined;
}

export function JsonLd({ current }: JsonLdProps) {
  const now = new Date().toISOString();

  const schemas = [
    // 1. WebApplication — describes the app itself
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'cs',
      dateModified: now,
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'Ministerstvo financí České republiky',
        url: 'https://www.mfcr.cz',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CZK',
        description: 'Bezplatný přístup k datům o cenách pohonných hmot',
      },
    },

    // 2. Dataset — enables Google Dataset Search indexing
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Maximální ceny pohonných hmot v České republice',
      alternateName: 'Czech Republic Maximum Fuel Prices',
      description:
        'Denní maximální regulované ceny benzínu Natural 95 a motorové nafty z Cenového věstníku Ministerstva financí ČR. Aktualizace v pracovní dny ve 14:05 SEČ.',
      url: `${SITE_URL}/api/history`,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      inLanguage: 'cs',
      temporalCoverage: '2024/..',
      dateModified: current?.imported_at ?? now,
      creator: {
        '@type': 'GovernmentOrganization',
        name: 'Ministerstvo financí České republiky',
        url: 'https://www.mfcr.cz',
      },
      distribution: [
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: `${SITE_URL}/api/latest`,
          name: 'Aktuální ceny (JSON)',
        },
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: `${SITE_URL}/api/history`,
          name: 'Historie cen (JSON)',
        },
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/rss+xml',
          contentUrl: `${SITE_URL}/feed.xml`,
          name: 'RSS feed',
        },
      ],
      variableMeasured: [
        {
          '@type': 'PropertyValue',
          name: 'gasoline_czk',
          description: 'Maximum price of Natural 95 gasoline in CZK per liter',
          unitCode: 'CZK/l',
          ...(current && { value: current.gasoline_czk }),
        },
        {
          '@type': 'PropertyValue',
          name: 'diesel_czk',
          description: 'Maximum price of Diesel in CZK per liter',
          unitCode: 'CZK/l',
          ...(current && { value: current.diesel_czk }),
        },
      ],
    },

    // 3. FAQPage — common questions about Czech fuel prices
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Jaká je aktuální maximální cena benzínu Natural 95?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: current
              ? `Aktuální maximální cena benzínu Natural 95 je ${current.gasoline_czk} Kč/l s platností od ${current.effective_date}.`
              : 'Aktuální cena je k dispozici na webu zakolikdnes.cz.',
          },
        },
        {
          '@type': 'Question',
          name: 'Jaká je aktuální maximální cena nafty?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: current
              ? `Aktuální maximální cena motorové nafty je ${current.diesel_czk} Kč/l s platností od ${current.effective_date}.`
              : 'Aktuální cena je k dispozici na webu zakolikdnes.cz.',
          },
        },
        {
          '@type': 'Question',
          name: 'Kdy se aktualizují ceny pohonných hmot?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ministerstvo financí ČR publikuje nové maximální ceny v pracovní dny (pondělí až pátek) ve 14:00. Data na tomto webu se aktualizují ve 14:05.',
          },
        },
        {
          '@type': 'Question',
          name: 'Odkud data o cenách pochází?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Data pochází z Cenového věstníku Ministerstva financí České republiky (mfcr.cz). Jedná se o oficiální regulované maximální ceny.',
          },
        },
        {
          '@type': 'Question',
          name: 'Jak mohu získat data o cenách pohonných hmot strojově?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Data jsou dostupná přes JSON API na ${SITE_URL}/api/latest (aktuální cena) a ${SITE_URL}/api/history (historie 30 dnů), přes RSS feed na ${SITE_URL}/feed.xml, nebo přes OpenAPI specifikaci na ${SITE_URL}/api/openapi.json.`,
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
