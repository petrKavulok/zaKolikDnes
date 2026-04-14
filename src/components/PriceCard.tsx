// Stateless display card for one fuel's current price with optional comparison data.
interface Props {
  label: string;
  price: number | null;
  effectiveDate: string | null;
  accent: string; // tailwind text color class
  previousPrice?: number | null;
  previousLabel?: string | null; // e.g. "než včera", "než v pátek"
  tomorrowPrice?: number | null;
  validUntil?: string | null;
}

function PriceDiff({ current, previous, suffix }: { current: number; previous: number; suffix?: string | null }) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) {
    return <span className="text-slate-500">beze změny{suffix ? ` ${suffix}` : ''}</span>;
  }
  const isUp = diff > 0;
  return (
    <span className={isUp ? 'text-red-400' : 'text-emerald-400'}>
      {isUp ? '↑' : '↓'} o {Math.abs(diff).toFixed(2)} Kč {isUp ? 'více' : 'méně'}{suffix ? ` ${suffix}` : ''}
    </span>
  );
}

export function PriceCard({
  label,
  price,
  effectiveDate,
  accent,
  previousPrice,
  previousLabel,
  tomorrowPrice,
  validUntil,
}: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 p-6 shadow-lg ring-1 ring-white/5">
      <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-5xl font-semibold ${accent}`}>
        {price != null ? price.toFixed(2) : '—'}{' '}
        <span className="text-2xl text-slate-400">Kč/l</span>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {effectiveDate ? `s platností od ${effectiveDate}` : 'žádná data'}
        {validUntil && ` · platné do ${validUntil}`}
      </div>

      {price != null && previousPrice != null && (
        <div className="mt-2 text-xs">
          <PriceDiff current={price} previous={previousPrice} suffix={previousLabel} />
        </div>
      )}

      {price != null && tomorrowPrice != null && (
        <div className="mt-3 rounded-lg bg-slate-700/40 px-3 py-2 text-sm">
          <span className="text-slate-400">Zítra: </span>
          <span className="font-medium text-slate-200">
            {tomorrowPrice.toFixed(2)} Kč/l
          </span>{' '}
          <span className="text-xs">
            <PriceDiff current={tomorrowPrice} previous={price} />
          </span>
        </div>
      )}
    </div>
  );
}
