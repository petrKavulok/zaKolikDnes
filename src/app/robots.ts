import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow everything except admin/cron routes
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/cron/', '/api/refresh'],
      },
      // Explicitly welcome AI crawlers (GEO best practice)
      ...(
        ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Googlebot-Extended', 'cohere-ai'] as const
      ).map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: ['/api/cron/', '/api/refresh'],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
