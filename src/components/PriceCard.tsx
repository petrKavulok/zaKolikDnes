// Stateless display card for one fuel's current price.
interface Props {
  label: string;
  price: number | null;
  effectiveDate: string | null;
  accent: string; // tailwind text color class
}

export function PriceCard({ label, price, effectiveDate, accent }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800/60 p-6 shadow-lg ring-1 ring-white/5">
      <div className="text-sm uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-5xl font-semibold ${accent}`}>
        {price != null ? price.toFixed(2) : '—'}{' '}
        <span className="text-2xl text-slate-400">Kč/l</span>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {effectiveDate ? `s účinností od ${effectiveDate}` : 'žádná data'}
      </div>
    </div>
  );
}
