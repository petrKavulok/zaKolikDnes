# zaKolikDnes

Tracks the **maximum fuel prices** (Natural 95 gasoline, diesel) published by the Czech Ministry of Finance in the *Cenový věstník*, and shows the current values plus a 30-day history chart.

Next.js (App Router) app deployed on **Vercel** with **Neon Postgres** for storage and **Vercel Cron** for scheduled scraping.

## Stack

- Next.js 14 + TypeScript + Tailwind
- Neon Postgres (`@neondatabase/serverless`)
- `axios`, `pdf-parse`, `cheerio`
- Recharts (history chart)
- pino (logging)
- Vitest (unit tests)
- Vercel Analytics

## Local development

```bash
npm install
npm run dev
```

You need a `DATABASE_URL` pointing to a Neon Postgres database (set in `.env` or via `vercel env pull`).

Open <http://localhost:3000>. Initially the page shows "no data" — trigger a scrape:

```bash
curl -X POST -H "x-admin-token: change-me" http://localhost:3000/api/refresh
```

### Database migration

Run once to create the `prices` table:

```bash
npm run db:migrate
```

## API

| Method | Path               | Description                                       |
|--------|--------------------|----------------------------------------------------|
| GET    | `/api/latest`      | Most recent stored prices (404 if empty)           |
| GET    | `/api/history`     | Last 30 records, newest first                      |
| POST   | `/api/refresh`     | Manually trigger a scrape (admin token req.)       |
| GET    | `/api/cron/scrape` | Vercel Cron endpoint (requires `CRON_SECRET` auth) |

## Tests

```bash
npm test
```

Covers the text-level extractor, validation rules (range, NaN, bad date) and a **malformed input** case that must not produce false positives.

## Scheduler

Vercel Cron triggers `GET /api/cron/scrape` on a schedule defined in [vercel.json](vercel.json) (currently `05 12 * * *` — daily at 12:05 UTC). The endpoint is protected by `CRON_SECRET` (Vercel injects the `Authorization: Bearer <CRON_SECRET>` header automatically).

## Configuration

| Var            | Purpose                                  |
|----------------|------------------------------------------|
| `DATABASE_URL` | Neon Postgres connection string           |
| `SOURCE_URL`   | Index page to discover bulletins          |
| `ADMIN_TOKEN`  | Header token for `/api/refresh`           |
| `CRON_SECRET`  | Vercel Cron authentication secret         |

## Project layout

```
src/
  app/                Next.js App Router (UI + API routes)
  components/         PriceCard, PriceChart, RefreshButton
  lib/                config, db, date, http, logger
  scraper/            source discovery, PDF/HTML parsing, validation, orchestrator
scripts/
  migrate.ts          One-time schema bootstrap
```

## Notes

- There is no official API for the bulletin — the scraper picks the newest "Cenový věstník" link from the configured index page, prefers the PDF, and falls back to HTML.
- Parsing uses regex/heuristics tolerant to whitespace and Czech diacritics. Validation enforces a 20–100 CZK/l range; out-of-range values are rejected and never written.
- Prices are de-duplicated by `bulletin_id` (primary key + `ON CONFLICT DO NOTHING`). `effective_date` has a unique constraint as well.
