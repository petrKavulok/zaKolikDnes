'use client';

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

export function PriceChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return <div className="text-slate-500">Zatím není dost dat pro graf.</div>;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
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
  );
}
