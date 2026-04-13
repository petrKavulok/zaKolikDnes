# zaKolikDnes

Tracks the **maximum fuel prices** (Natural 95 gasoline, diesel) published by the Czech Ministry of Finance in the *Cenový věstník*, and shows the current values plus a 30-day history chart.

Single Next.js (App Router) app: scraper, scheduler, SQLite, REST API, and UI in one container.

## Stack

- Next.js 14 + TypeScript + Tailwind
- SQLite (`better-sqlite3`)
- `axios`, `pdf-parse`, `cheerio`, `node-cron`
- Recharts (history chart)
- pino (console + file logging)
- Vitest (unit tests)

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>. Initially the page shows "no data" — trigger a scrape:

```bash
curl -X POST -H "x-admin-token: change-me" http://localhost:3000/api/refresh
```

## API

| Method | Path           | Description                                  |
|--------|----------------|----------------------------------------------|
| GET    | `/api/latest`  | Most recent stored prices (404 if empty)     |
| GET    | `/api/history` | Last 30 records, newest first                |
| POST   | `/api/refresh` | Manually trigger a scrape (admin token req.) |

## Tests

```bash
npm test
```

Covers the text-level extractor, validation rules (range, NaN, bad date) and a **malformed input** case that must not produce false positives.

## Scheduler

`node-cron` job started by Next.js's `instrumentation` hook on server boot. Default schedule: `0 8 * * *` (daily 08:00 server time). Configurable via `CRON_EXPR`. On failure the scrape is retried once after 60 s; on second failure the last valid DB row is preserved.

## Configuration

All env vars live in [.env.example](.env.example):

| Var          | Default                                              | Purpose                          |
|--------------|------------------------------------------------------|----------------------------------|
| `SOURCE_URL` | `https://www.mfcr.cz/cs/legislativa/cenovy-vestnik` | Index page to discover bulletins |
| `CRON_EXPR`  | `0 8 * * *`                                          | Daily scrape time                |
| `ADMIN_TOKEN`| `change-me`                                          | Header for `/api/refresh`        |
| `DB_PATH`    | `./data/prices.db`                                   | SQLite location                  |
| `LOG_DIR`    | `./data/logs`                                        | Log file directory               |

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Then visit <http://localhost:3000>. Data and logs persist in `./data/` (mounted volume).

## Project layout

```
src/
  app/                Next.js App Router (UI + API routes)
  components/         PriceCard, PriceChart
  lib/                config, db, http, logger
  scraper/            source discovery, PDF/HTML parsing, validation, orchestrator
  scheduler/          node-cron job
  instrumentation.ts  starts the scheduler at server boot
tests/                Vitest unit tests
```

## Notes

- There is no official API for the bulletin — the scraper picks the newest "Cenový věstník" link from the configured index page, prefers the PDF, and falls back to HTML.
- Parsing uses regex/heuristics tolerant to whitespace and Czech diacritics. Validation enforces a 20–100 CZK/l range; out-of-range values are rejected and never written.
- Prices are de-duplicated by `effective_date` (primary key + `INSERT OR IGNORE`).
