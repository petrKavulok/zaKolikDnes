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

## Embeddable widget

A single-file JavaScript widget (`public/widget.js`) can be dropped into any website to display the current fuel price cap. No build step, no dependencies, Shadow-DOM-isolated so it won't clash with host-page CSS.

### Quick start

Drop this anywhere in your HTML — the widget auto-mounts at the end of `<body>`:

```html
<script src="https://zakolikdnes.cz/widget.js"></script>
```

Control theme and language:

```html
<script src="https://zakolikdnes.cz/widget.js"
        data-theme="dark"
        data-lang="cs"></script>
```

Mount into a specific element instead of auto-appending:

```html
<div id="fuel-cap-widget"></div>
<script src="https://zakolikdnes.cz/widget.js" data-theme="dark"></script>
```

### Configuration

All attributes go on the `<script>` tag (or on the host element, which takes precedence — useful when the script is injected dynamically):

| Attribute     | Values              | Default     | Description                                            |
|---------------|---------------------|-------------|--------------------------------------------------------|
| `data-theme`  | `light` \| `dark`   | `light`     | Colour scheme.                                         |
| `data-lang`   | `en` \| `cs`        | `en`        | UI labels, number and date formatting.                 |
| `data-target` | CSS selector        | —           | Explicit mount target. Overrides `#fuel-cap-widget`.   |
| `data-api`    | URL                 | production  | API base override (for local testing or self-hosting). |

### What it does

- Fetches `/api/latest` (3 s timeout) and renders `Gasoline` / `Diesel` / `Updated` in an isolated Shadow DOM.
- Adds a ↑ ↓ — trend indicator by diffing against `/api/history[1]` (best-effort; widget still renders if the history call fails).
- Animates the numbers on load (respects `prefers-reduced-motion`).
- Shows `Data unavailable` under the title on any fetch / validation failure.

### Mount resolution order

1. `data-target` selector (on the script), if it resolves to one or more elements.
2. Every `.fuel-cap-widget` on the page (multi-instance).
3. `#fuel-cap-widget`, if present.
4. A fresh `<div>` appended to `<body>`.

### Live preview

[`/embed`](https://zakolikdnes.cz/embed) renders all four `theme × lang` variants side-by-side with copy-paste snippets.

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
