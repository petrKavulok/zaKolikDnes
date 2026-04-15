/** Shared headers for public API routes (CORS, caching, metadata). */
export function apiHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    // HTTP header values are ByteString — non-ASCII bytes (the Czech diacritics
    // ě/č/ý) make undici throw on serialisation. ASCII-only variant of the same
    // name: "Cenový věstník MF ČR" → "Cenovy vestnik MF CR".
    'X-Data-Source': 'Czech Ministry of Finance Price Bulletin (Cenovy vestnik MF CR)',
    'X-Update-Schedule': 'Mon-Fri 14:05 CET/CEST',
    ...extra,
  };
}

/** OPTIONS handler for CORS preflight requests. */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: apiHeaders(),
  });
}
