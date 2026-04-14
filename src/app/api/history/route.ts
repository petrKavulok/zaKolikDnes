import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db';
import { apiHeaders, OPTIONS } from '@/lib/api-headers';

export { OPTIONS };
export const revalidate = 3600;
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getHistory(30), { headers: apiHeaders() });
}
