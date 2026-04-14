import { getHistory } from '@/lib/db';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const revalidate = 3600;

export async function GET() {
  const rows = await getHistory(30);

  const items = rows
    .map(
      (r) => `    <item>
      <title>Ceny PHM od ${r.effective_date}: Natural 95 ${r.gasoline_czk} Kč/l, Nafta ${r.diesel_czk} Kč/l</title>
      <link>${r.source_url ?? SITE_URL}</link>
      <guid isPermaLink="false">${r.bulletin_id}</guid>
      <pubDate>${new Date(r.effective_date + 'T14:05:00+02:00').toUTCString()}</pubDate>
      <description>Maximální cena Natural 95: ${r.gasoline_czk} Kč/l. Maximální cena nafty: ${r.diesel_czk} Kč/l. Platnost od ${r.effective_date}. Zdroj: Cenový věstník MF ČR (${r.bulletin_id}).</description>
    </item>`,
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} – Maximální ceny pohonných hmot v ČR</title>
    <link>${SITE_URL}</link>
    <description>Denní maximální regulované ceny benzínu Natural 95 a motorové nafty z Cenového věstníku Ministerstva financí ČR.</description>
    <language>cs</language>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
