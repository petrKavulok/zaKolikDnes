import { NextRequest, NextResponse } from 'next/server';
import { recordSlevaClick } from '@/lib/db';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const source = body.source === 'embed' ? 'embed' : 'main';

  await recordSlevaClick(source);

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
