// Home page — server component reading directly from SQLite (no HTTP hop).
import { getHistory, getLatest } from '@/lib/db';
import { formatDate } from '@/lib/date';
import { PriceCard } from '@/components/PriceCard';
import { PriceChart, ChartPoint } from '@/components/PriceChart';
import { RefreshButton } from '@/components/RefreshButton';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const latest = await getLatest();
  const history = await getHistory(30);
  // DEBUG: surface DB state in the dev server console
  console.log('[page] latest:', latest);
  console.log('[page] history length:', history.length, 'first:', history[0]);
  // Chart wants oldest → newest for a nice left-to-right line.
  const chartData: ChartPoint[] = [...history].reverse().map((r) => ({
    date: formatDate(r.effective_date),
    gasoline: r.gasoline_czk,
    diesel: r.diesel_czk,
  }));

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
          price={latest?.gasoline_czk ?? null}
          effectiveDate={latest ? formatDate(latest.effective_date) : null}
        />
        <PriceCard
          label="Diesel"
          aria-label="Vin Diesel"
          accent="text-sky-400"
          price={latest?.diesel_czk ?? null}
          effectiveDate={latest ? formatDate(latest.effective_date) : null}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Historie (30 dní)</h2>
        <PriceChart data={chartData} />
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        Naposledy importováno: {latest ? formatDate(latest.imported_at) : '—'}
      </footer>
    </main>
  );
}
