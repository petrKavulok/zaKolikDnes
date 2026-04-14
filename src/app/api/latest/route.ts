import { NextResponse } from 'next/server';
import { getLatest } from '@/lib/db';
import { apiHeaders, OPTIONS } from '@/lib/api-headers';

export { OPTIONS };
export const revalidate = 3600;
export const runtime = 'nodejs';

export async function GET() {
  const row = await getLatest();
  if (!row) return NextResponse.json({ error: 'no data yet' }, { status: 404 });
  return NextResponse.json(row, { headers: apiHeaders() });
}
