// Embed demo page — live previews of widget.js and copy-paste snippets.
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Vložit widget – ${SITE_NAME}`,
  description:
    'Vložte aktuální maximální ceny pohonných hmot (Natural 95 a nafta) na svůj web jedním řádkem kódu.',
  alternates: { canonical: '/embed' },
  openGraph: {
    title: `Vložit widget – ${SITE_NAME}`,
    description:
      'Vložte aktuální maximální ceny pohonných hmot na svůj web jedním řádkem kódu.',
    url: `${SITE_URL}/embed`,
    type: 'website',
  },
};

type Theme = 'light' | 'dark';
type Lang = 'en' | 'cs';

const SNIPPET_BASIC = `<script src="${SITE_URL}/widget.js"></script>`;

const SNIPPET_CONFIGURED = `<script src="${SITE_URL}/widget.js"
        data-theme="dark"
        data-lang="cs"></script>`;

const SNIPPET_TARGET = `<div id="fuel-cap-widget"></div>
<script src="${SITE_URL}/widget.js" data-theme="dark"></script>`;

function variantLabel(theme: Theme, lang: Lang): string {
  const t = theme === 'dark' ? 'Tmavý' : 'Světlý';
  const l = lang === 'cs' ? 'čeština' : 'angličtina';
  return `${t} · ${l}`;
}

function DemoSlot({ theme, lang }: { theme: Theme; lang: Lang }) {
  const slotId = `demo-${theme}-${lang}`;
  return (
    <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {variantLabel(theme, lang)}
      </div>
      <div
        className="fuel-cap-widget"
        id={slotId}
        data-theme={theme}
        data-lang={lang}
      />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-200 ring-1 ring-white/5">
      <code>{code}</code>
    </pre>
  );
}

function ConfigTable() {
  const rows: Array<{ attr: string; values: string; default: string; note: string }> = [
    { attr: 'data-theme', values: '"light" | "dark"', default: '"light"', note: 'Barevné schéma karty.' },
    { attr: 'data-lang', values: '"en" | "cs"', default: '"en"', note: 'Jazyk popisků, formátu čísel a data.' },
    { attr: 'data-target', values: 'CSS selektor', default: '—', note: 'Prvek, do kterého se widget připojí.' },
    { attr: 'data-api', values: 'URL', default: SITE_URL, note: 'Přepsání základního API (pro testování).' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-white/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Atribut</th>
            <th className="px-4 py-3 font-semibold">Hodnoty</th>
            <th className="px-4 py-3 font-semibold">Výchozí</th>
            <th className="px-4 py-3 font-semibold">Popis</th>
          </tr>
        </thead>
        <tbody className="bg-slate-800/40 text-slate-200">
          {rows.map((r) => (
            <tr key={r.attr} className="border-t border-white/5">
              <td className="px-4 py-3 font-mono text-amber-300">{r.attr}</td>
              <td className="px-4 py-3 font-mono text-slate-300">{r.values}</td>
              <td className="px-4 py-3 font-mono text-slate-400">{r.default}</td>
              <td className="px-4 py-3 text-slate-400">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <main className="relative z-10 mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">Vložit widget</h1>
        <p className="mt-2 text-slate-400">
          Zobrazte aktuální maximální ceny benzínu Natural 95 a nafty z{' '}
          Cenového věstníku MF ČR na svém webu. Jeden řádek kódu, bez závislostí.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Živá ukázka</h2>
        <p className="mb-4 text-sm text-slate-400">
          Čtyři varianty — světlý a tmavý motiv, anglicky a česky.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DemoSlot theme="light" lang="en" />
          <DemoSlot theme="dark" lang="en" />
          <DemoSlot theme="light" lang="cs" />
          <DemoSlot theme="dark" lang="cs" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Základní použití</h2>
        <p className="mb-3 text-sm text-slate-400">
          Vložte následující řádek kamkoli do HTML. Widget se automaticky připojí
          na konec stránky.
        </p>
        <CodeBlock code={SNIPPET_BASIC} />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Nastavení motivu a jazyka</h2>
        <CodeBlock code={SNIPPET_CONFIGURED} />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Vlastní umístění</h2>
        <p className="mb-3 text-sm text-slate-400">
          Widget se připojí do elementu <code className="font-mono text-amber-300">#fuel-cap-widget</code>,
          pokud existuje. Pro jiný cíl použijte atribut{' '}
          <code className="font-mono text-amber-300">data-target</code> s CSS selektorem.
        </p>
        <CodeBlock code={SNIPPET_TARGET} />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Konfigurace</h2>
        <ConfigTable />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Co widget umí</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Izolovaný Shadow DOM — žádný konflikt se styly hostitelské stránky.</li>
          <li>Automatická detekce změny oproti předchozímu věstníku (šipky ↑ ↓).</li>
          <li>Respektuje <code className="font-mono text-amber-300">prefers-reduced-motion</code>.</li>
          <li>Bezpečná data — žádné <code className="font-mono text-amber-300">innerHTML</code> s dynamickým obsahem.</li>
          <li>Timeout 3 s a grafický fallback při nedostupnosti API.</li>
        </ul>
      </section>

      <footer className="mt-10 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-300">← Zpět na hlavní stránku</Link>
      </footer>

      {/*
        Loaded after hydration; the widget reads per-host data-* from the
        .fuel-cap-widget divs above and mounts a shadow root into each.
      */}
      <Script src="/widget.js" strategy="afterInteractive" />
    </main>
  );
}
