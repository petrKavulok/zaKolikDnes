'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface ChartPoint {
  date: string;
  gasoline: number;
  diesel: number;
}

export function PriceChart({ data, allData }: { data: ChartPoint[]; allData?: ChartPoint[] }) {
  const [showAll, setShowAll] = useState(false);
  const active = showAll && allData ? allData : data;

  if (active.length === 0) {
    return <div className="text-slate-500">Zatím není dost dat pro graf.</div>;
  }

  // Thin out x-axis labels when there are many data points to avoid overlap.
  const tickInterval = active.length > 40 ? 'preserveStartEnd' : 0;

  return (
    <div>
      {allData && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              !showAll ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aktuální regulace
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              showAll ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Veškerá data
          </button>
        </div>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={active} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} interval={tickInterval} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend />
            <Line type="monotone" dataKey="gasoline" name="Natural 95" stroke="#fbbf24" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="diesel" name="Diesel" stroke="#60a5fa" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
