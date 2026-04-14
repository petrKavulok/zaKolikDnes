// Home page — server component reading directly from the database.
import Image from 'next/image';
import { getPriceContext, getHistory } from '@/lib/db';
import { formatDate, todayPrague, tomorrowPrague, addDays, nextUpdateLabel, previousPriceLabel } from '@/lib/date';
import { SITE_URL } from '@/lib/constants';
import { PriceCard } from '@/components/PriceCard';
import { PriceChart, ChartPoint } from '@/components/PriceChart';
import { RefreshButton } from '@/components/RefreshButton';
import { ChciSlevuButton } from '@/components/ChciSlevuButton';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 3600;

export default async function Page() {
  const today = todayPrague();
  const tomorrow = tomorrowPrague();

  const [{ current, next, previous }, history] = await Promise.all([
    getPriceContext(today),
    getHistory(30),
  ]);

  // Chart wants oldest → newest for a nice left-to-right line.
  const chartData: ChartPoint[] = [...history].reverse().map((r) => ({
    date: r.effective_date.replace(/^(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => `${+d}.${+m}.${y}`),
    gasoline: r.gasoline_czk,
    diesel: r.diesel_czk,
  }));

  const hasTomorrowPrice = next?.effective_date === tomorrow;

  // Show "valid until" only when the next price is NOT tomorrow
  const validUntilIso =
    next && !hasTomorrowPrice ? addDays(next.effective_date, -1) : null;
  const validUntil = validUntilIso ? formatDate(validUntilIso) : null;

  const prevLabel = previous
    ? previousPriceLabel(previous.effective_date)
    : null;

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-4 py-10">
      <JsonLd current={current} />

      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Image
            src="/og-image.png"
            alt="Za kolik dnes? – přehled maximálních cen pohonných hmot v ČR"
            width={48}
            height={48}
            className="mt-1 h-12 w-auto scale-x-[-1] rounded"
            priority
          />
          <div>
            <h1 className="text-3xl font-bold">Za kolik dnes?</h1>
            <p className="mt-1 text-slate-400">
              Aktuální maximální ceny benzínu Natural 95 a nafty z Cenového věstníku Ministerstva financí ČR. Aktualizace každý pracovní den ve 14:05.
            </p>
          </div>
        </div>
        <RefreshButton />
      </header>

      <article>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PriceCard
            label="Natural 95"
            accent="text-amber-400"
            price={current?.gasoline_czk ?? null}
            effectiveDate={current ? formatDate(current.effective_date) : null}
            effectiveDateIso={current?.effective_date ?? null}
            previousPrice={previous?.gasoline_czk}
            previousLabel={prevLabel}
            tomorrowPrice={hasTomorrowPrice ? next.gasoline_czk : null}
            validUntil={validUntil}
            validUntilIso={validUntilIso}
          />
          <PriceCard
            label="Diesel"
            aria-label="Vin Diesel"
            accent="text-sky-400"
            price={current?.diesel_czk ?? null}
            effectiveDate={current ? formatDate(current.effective_date) : null}
            effectiveDateIso={current?.effective_date ?? null}
            previousPrice={previous?.diesel_czk}
            previousLabel={prevLabel}
            tomorrowPrice={hasTomorrowPrice ? next.diesel_czk : null}
            validUntil={validUntil}
            validUntilIso={validUntilIso}
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Historie (30 dní)</h2>
          <PriceChart data={chartData} />
        </section>
      </article>

      <div className="mt-8 text-center">
        <ChciSlevuButton />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Často kladené otázky</h2>
        <dl className="space-y-4 text-sm text-slate-300">
          <div>
            <dt className="font-medium text-slate-200">Jaká je aktuální maximální cena benzínu Natural 95?</dt>
            <dd className="mt-1 text-slate-400">
              {current
                ? <>Maximální cena benzínu Natural 95 je <strong>{current.gasoline_czk.toFixed(2)} Kč/l</strong> s platností od <time dateTime={current.effective_date}>{formatDate(current.effective_date)}</time>.</>
                : 'Aktuální data nejsou k dispozici.'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Jaká je aktuální maximální cena nafty?</dt>
            <dd className="mt-1 text-slate-400">
              {current
                ? <>Maximální cena motorové nafty je <strong>{current.diesel_czk.toFixed(2)} Kč/l</strong> s platností od <time dateTime={current.effective_date}>{formatDate(current.effective_date)}</time>.</>
                : 'Aktuální data nejsou k dispozici.'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Kdy se ceny pohonných hmot aktualizují?</dt>
            <dd className="mt-1 text-slate-400">
              Ministerstvo financí ČR publikuje nové maximální ceny v pracovní dny (pondělí až pátek) ve 14:00. Data na tomto webu se aktualizují ve 14:05.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Odkud data o cenách pochází?</dt>
            <dd className="mt-1 text-slate-400">
              Data pochází z Cenového věstníku Ministerstva financí České republiky (<a href="https://www.mfcr.cz/cs/legislativa/cenovy-vestnik" className="underline hover:text-slate-200" rel="noopener">mfcr.cz</a>). Jedná se o oficiální regulované maximální ceny.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Jak mohu získat data strojově?</dt>
            <dd className="mt-1 text-slate-400">
              Data jsou dostupná přes{' '}
              <a href={`${SITE_URL}/api/latest`} className="underline hover:text-slate-200">JSON API (aktuální cena)</a>,{' '}
              <a href={`${SITE_URL}/api/history`} className="underline hover:text-slate-200">JSON API (historie)</a>,{' '}
              <a href={`${SITE_URL}/feed.xml`} className="underline hover:text-slate-200">RSS feed</a> a{' '}
              <a href={`${SITE_URL}/api/openapi.json`} className="underline hover:text-slate-200">OpenAPI specifikaci</a>.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        Naposledy importováno:{' '}
        {current ? (
          <time dateTime={current.imported_at}>{formatDate(current.imported_at)}</time>
        ) : '—'}
        {' · '}Další aktualizace {nextUpdateLabel()}
      </footer>
    </main>
  );
}
