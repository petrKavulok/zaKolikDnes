import { NextResponse } from 'next/server';
import { getLatest } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const row = await getLatest();
  if (!row) return NextResponse.json({ error: 'no data yet' }, { status: 404 });
  return NextResponse.json(row);
}
