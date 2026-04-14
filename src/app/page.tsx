// Home page — server component reading directly from the database.
import { getPriceContext, getHistory } from '@/lib/db';
import { formatDate, todayPrague, tomorrowPrague, addDays, nextUpdateLabel, previousPriceLabel } from '@/lib/date';
import { PriceCard } from '@/components/PriceCard';
import { PriceChart, ChartPoint } from '@/components/PriceChart';
import { RefreshButton } from '@/components/RefreshButton';

export const dynamic = 'force-dynamic';

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
  const validUntil =
    next && !hasTomorrowPrice
      ? formatDate(addDays(next.effective_date, -1))
      : null;

  const prevLabel = previous
    ? previousPriceLabel(previous.effective_date)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <img
            src="/pump.png"
            alt="zaKolikDnes logo"
            width={100}
            height={100}
            className="mt-1 h-12 w-12 rounded"
          />
          <div>
            <h1 className="text-3xl font-bold">Za kolik dnes?</h1>
            <p className="mt-1 text-slate-400">
              Maximální ceny pohonných hmot přímo od Alenky(z Cenového věstníku MF ČR).
            </p>
          </div>
        </div>
        <RefreshButton />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PriceCard
          label="Natural 95"
          accent="text-amber-400"
          price={current?.gasoline_czk ?? null}
          effectiveDate={current ? formatDate(current.effective_date) : null}
          previousPrice={previous?.gasoline_czk}
          previousLabel={prevLabel}
          tomorrowPrice={hasTomorrowPrice ? next.gasoline_czk : null}
          validUntil={validUntil}
        />
        <PriceCard
          label="Diesel"
          aria-label="Vin Diesel"
          accent="text-sky-400"
          price={current?.diesel_czk ?? null}
          effectiveDate={current ? formatDate(current.effective_date) : null}
          previousPrice={previous?.diesel_czk}
          previousLabel={prevLabel}
          tomorrowPrice={hasTomorrowPrice ? next.diesel_czk : null}
          validUntil={validUntil}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Historie (30 dní)</h2>
        <PriceChart data={chartData} />
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        Naposledy importováno: {current ? formatDate(current.imported_at) : '—'}
        {' · '}Další aktualizace {nextUpdateLabel()}
      </footer>
    </main>
  );
}
