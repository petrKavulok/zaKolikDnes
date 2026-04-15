/*!
 * Za kolik dnes? — embeddable fuel-price widget.
 * Renders the latest Czech Ministry of Finance fuel price cap into a
 * Shadow-DOM-isolated card. No dependencies, no build step.
 *
 *   <script src="https://zakolikdnes.cz/widget.js"
 *     data-theme="dark"      <!-- "light" | "dark"     (default: light)  -->
 *     data-lang="cs"         <!-- "en" | "cs"           (default: en)     -->
 *     data-target="#slot"    <!-- CSS selector          (optional)        -->
 *     data-api="https://..." <!-- base URL override     (optional)        -->
 *   ></script>
 *
 * The same data-* attributes are also read from the host element (handy when
 * the script is injected dynamically, e.g. via next/script or GTM, where
 * document.currentScript is null). Host attributes take precedence.
 *
 * Mount resolution (first match wins):
 *   1. data-target selector, if it resolves (may be one or many elements)
 *   2. every .fuel-cap-widget on the page (multi-instance)
 *   3. #fuel-cap-widget, if present
 *   4. a fresh <div> appended to <body>
 *
 * Source: https://zakolikdnes.cz
 */
(function () {
  'use strict';

  // ---------- constants ----------
  var DEFAULT_BASE = 'https://zakolikdnes.cz';
  var TIMEOUT_MS = 3000;

  var I18N = {
    en: {
      title: 'Czech Fuel Price Cap',
      gasoline: 'Gasoline',
      diesel: 'Diesel',
      updated: 'Updated',
      unavailable: 'Data unavailable',
      unit: 'CZK/l',
      vs: 'vs.',
      locale: 'en-GB',
    },
    cs: {
      title: 'Ceny PHM',
      gasoline: 'Benzín',
      diesel: 'Nafta',
      updated: 'Aktualizováno',
      unavailable: 'Data nedostupná',
      unit: 'Kč/l',
      vs: 'oproti',
      locale: 'cs-CZ',
    },
  };

  // ---------- config ----------
  // Resolve the script tag. `document.currentScript` is set during synchronous
  // script execution — the common case. Async/defer/bundled loads fall back
  // to an src lookup.
  function getScript() {
    return (
      document.currentScript ||
      document.querySelector('script[src*="widget.js"]') ||
      null
    );
  }

  // Parses data-* from a single source (script or host element).
  function readDataset(ds) {
    ds = ds || {};
    return {
      lang: ds.lang,
      theme: ds.theme,
      target: typeof ds.target === 'string' ? ds.target : undefined,
      api: ds.api,
    };
  }

  // Script tag config, read eagerly so we can find the host first.
  function readScriptConfig() {
    var script = getScript();
    return readDataset(script && script.dataset);
  }

  // Merge script config with host element config (host wins) and normalize.
  function mergeConfig(scriptCfg, host) {
    var hostCfg = readDataset(host && host.dataset);
    var pick = function (k) { return hostCfg[k] != null && hostCfg[k] !== '' ? hostCfg[k] : scriptCfg[k]; };

    var lang = pick('lang') === 'cs' ? 'cs' : 'en';
    var theme = pick('theme') === 'dark' ? 'dark' : 'light';

    // data-api accepts either a base ("https://example.com") or the full
    // endpoint ("https://example.com/api/latest"). Normalise both to a base.
    var rawApi = pick('api');
    var base = (rawApi ? String(rawApi) : DEFAULT_BASE)
      .replace(/\/+$/, '')
      .replace(/\/api\/latest$/, '');

    return {
      lang: lang,
      theme: theme,
      latestUrl: base + '/api/latest',
      historyUrl: base + '/api/history',
    };
  }

  // ---------- mount ----------
  function resolveMounts(scriptCfg) {
    if (scriptCfg.target) {
      var targeted = document.querySelectorAll(scriptCfg.target);
      if (targeted.length) return Array.prototype.slice.call(targeted);
    }
    var multi = document.querySelectorAll('.fuel-cap-widget');
    if (multi.length) return Array.prototype.slice.call(multi);
    var named = document.getElementById('fuel-cap-widget');
    if (named) return [named];
    var host = document.createElement('div');
    host.className = 'fuel-cap-widget-auto';
    document.body.appendChild(host);
    return [host];
  }

  // ---------- fetch ----------
  function fetchJson(url, signal) {
    return fetch(url, {
      method: 'GET',
      signal: signal,
      credentials: 'omit',
      mode: 'cors',
      headers: { Accept: 'application/json' },
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // The real API returns gasoline_czk / diesel_czk / effective_date. The
  // task-spec shape ({ gasoline, diesel, date }) is also accepted so the
  // widget keeps working if the API is ever simplified.
  function normalize(row) {
    if (!row || typeof row !== 'object') return null;
    var gasoline = typeof row.gasoline === 'number' ? row.gasoline : row.gasoline_czk;
    var diesel = typeof row.diesel === 'number' ? row.diesel : row.diesel_czk;
    var date = typeof row.date === 'string' ? row.date : row.effective_date;
    if (!Number.isFinite(gasoline) || !Number.isFinite(diesel) || !date) return null;
    return {
      gasoline: gasoline,
      diesel: diesel,
      date: date,
      bulletin: row.bulletin_id || '',
    };
  }

  function fetchLatest(url, signal) {
    return fetchJson(url, signal).then(function (data) {
      var row = normalize(data);
      if (!row) throw new Error('invalid shape');
      return row;
    });
  }

  // Trend is best-effort. Any failure resolves to null so the primary
  // render path is unaffected.
  function fetchPrevious(url, signal) {
    return fetchJson(url, signal)
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length < 2) return null;
        return normalize(rows[1]); // /api/history returns DESC: [0]=latest, [1]=prev
      })
      .catch(function () {
        return null;
      });
  }

  // ---------- formatting ----------
  function formatPrice(n, lang) {
    try {
      return n.toLocaleString(I18N[lang].locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (_) {
      return n.toFixed(2);
    }
  }

  // Parse YYYY-MM-DD as a local date so the rendered day matches the
  // bulletin day regardless of the viewer's timezone.
  function parseIsoDay(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(iso, lang) {
    var d = parseIsoDay(iso);
    if (!d) return iso;
    try {
      return new Intl.DateTimeFormat(I18N[lang].locale, {
        day: lang === 'cs' ? 'numeric' : '2-digit',
        month: lang === 'cs' ? 'numeric' : 'short',
        year: 'numeric',
      }).format(d);
    } catch (_) {
      return iso;
    }
  }

  // ---------- trend ----------
  function computeTrend(curr, prev, which) {
    if (!prev) return null;
    // Round the delta to 2 dp before deciding direction — avoids flagging
    // 0.0000001 rounding noise as a change.
    var delta = Math.round((curr[which] - prev[which]) * 100) / 100;
    var dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    return { dir: dir, delta: delta, bulletin: prev.bulletin || prev.date };
  }

  function trendGlyph(dir) {
    return dir === 'up' ? '\u2191' : dir === 'down' ? '\u2193' : '\u2014';
  }

  // ---------- styles ----------
  var SHARED_CSS = [
    // Host is the only selector that can leak across the boundary; reset it.
    ':host{all:initial;display:block;contain:content;}',
    '.fcw{',
    'box-sizing:border-box;',
    'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'font-size:14px;line-height:1.4;',
    'max-width:320px;padding:16px 18px;',
    'border-radius:16px;',
    '-webkit-font-smoothing:antialiased;',
    '}',
    '.fcw *{box-sizing:border-box;}',
    '.fcw__title{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin:0 0 10px;opacity:.75;}',
    '.fcw__row{display:flex;align-items:baseline;justify-content:space-between;margin:6px 0;gap:12px;}',
    '.fcw__label{font-size:13px;opacity:.9;display:inline-flex;align-items:center;}',
    '.fcw__dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;}',
    '.fcw__dot--gas{background:var(--fcw-gas);}',
    '.fcw__dot--dsl{background:var(--fcw-dsl);}',
    '.fcw__value{font-variant-numeric:tabular-nums;font-weight:600;font-size:18px;display:inline-flex;align-items:baseline;gap:6px;}',
    '.fcw--gas .fcw__num{color:var(--fcw-gas);}',
    '.fcw--dsl .fcw__num{color:var(--fcw-dsl);}',
    '.fcw__num{display:inline-block;min-width:3ch;text-align:right;}',
    '.fcw__unit{font-size:12px;font-weight:400;opacity:.7;}',
    '.fcw__trend{font-size:13px;font-weight:700;display:inline-block;width:1em;text-align:center;cursor:help;}',
    '.fcw__trend--up{color:#ef4444;}',
    '.fcw__trend--down{color:#10b981;}',
    '.fcw__trend--flat{color:#94a3b8;}',
    '.fcw__footer{margin-top:10px;padding-top:8px;border-top:1px solid var(--fcw-rule);font-size:11px;opacity:.75;display:flex;justify-content:space-between;align-items:center;gap:8px;}',
    '.fcw__attr{text-decoration:none;color:inherit;opacity:.7;}',
    '.fcw__attr:hover{opacity:1;text-decoration:underline;}',
    '.fcw__error{font-size:13px;opacity:.85;margin:0;}',
  ].join('');

  var LIGHT_CSS =
    '.fcw{background:#ffffff;color:#0f172a;' +
    'border:1px solid rgba(15,23,42,.08);' +
    'box-shadow:0 4px 20px rgba(15,23,42,.08);' +
    '--fcw-gas:#b45309;--fcw-dsl:#1d4ed8;--fcw-rule:rgba(15,23,42,.10);}';

  var DARK_CSS =
    '.fcw{background:#1e293b;color:#e6eaf3;' +
    'box-shadow:0 4px 24px rgba(0,0,0,.35);' +
    '--fcw-gas:#fbbf24;--fcw-dsl:#60a5fa;--fcw-rule:rgba(148,163,184,.22);}';

  function themeCss(theme) {
    return theme === 'dark' ? DARK_CSS : LIGHT_CSS;
  }

  // ---------- DOM helpers ----------
  // Text-only factory — keeps dynamic content out of innerHTML.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- render ----------
  function render(root, data, trendGas, trendDsl, cfg) {
    var t = I18N[cfg.lang];
    var card = el('div', 'fcw');
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', t.title);

    card.appendChild(el('h2', 'fcw__title', t.title));
    card.appendChild(buildRow('gas', t.gasoline, data.gasoline, trendGas, cfg));
    card.appendChild(buildRow('dsl', t.diesel, data.diesel, trendDsl, cfg));

    var footer = el('div', 'fcw__footer');
    footer.appendChild(el('span', null, t.updated + ': ' + formatDate(data.date, cfg.lang)));

    var attr = el('a', 'fcw__attr', 'zakolikdnes.cz');
    attr.href = 'https://zakolikdnes.cz/';
    attr.target = '_blank';
    attr.rel = 'noopener noreferrer';
    footer.appendChild(attr);
    card.appendChild(footer);

    root.appendChild(card);
  }

  function buildRow(kind, label, value, trend, cfg) {
    var t = I18N[cfg.lang];
    var row = el('div', 'fcw__row fcw--' + kind);

    var lbl = el('span', 'fcw__label');
    lbl.appendChild(el('span', 'fcw__dot fcw__dot--' + kind));
    lbl.appendChild(document.createTextNode(label));
    row.appendChild(lbl);

    var val = el('span', 'fcw__value');
    var num = el('span', 'fcw__num');
    num.dataset.value = String(value);
    num.textContent = formatPrice(0, cfg.lang); // starting frame for the animation
    val.appendChild(num);
    val.appendChild(el('span', 'fcw__unit', t.unit));

    if (trend) {
      var glyph = el('span', 'fcw__trend fcw__trend--' + trend.dir, trendGlyph(trend.dir));
      var sign = trend.delta > 0 ? '+' : '';
      var tip =
        sign + formatPrice(trend.delta, cfg.lang) + ' ' + t.unit +
        (trend.bulletin ? ' ' + t.vs + ' ' + trend.bulletin : '');
      glyph.setAttribute('aria-label', tip);
      glyph.title = tip;
      val.appendChild(glyph);
    }

    row.appendChild(val);
    return row;
  }

  function renderError(root, cfg) {
    var t = I18N[cfg.lang];
    var card = el('div', 'fcw');
    card.setAttribute('role', 'status');
    card.appendChild(el('h2', 'fcw__title', t.title));
    card.appendChild(el('p', 'fcw__error', t.unavailable));
    root.appendChild(card);
  }

  // ---------- number animation ----------
  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) {
      return false;
    }
  }

  function animateNumbers(root, cfg) {
    var nodes = root.querySelectorAll('.fcw__num');
    var reduce = prefersReducedMotion();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var target = parseFloat(n.dataset.value);
      if (!Number.isFinite(target)) continue;
      if (reduce) {
        n.textContent = formatPrice(target, cfg.lang);
      } else {
        tween(n, target, cfg.lang);
      }
    }
  }

  function tween(node, target, lang) {
    var duration = 600;
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      node.textContent = formatPrice(target * eased, lang);
      if (p < 1) requestAnimationFrame(frame);
      else node.textContent = formatPrice(target, lang);
    }
    requestAnimationFrame(frame);
  }

  // Prepares a clean shadow root on `host` and injects theme CSS.
  function prepareShadow(host, cfg) {
    var shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    while (shadow.firstChild) shadow.removeChild(shadow.firstChild); // idempotent re-mount
    var style = document.createElement('style');
    style.textContent = SHARED_CSS + themeCss(cfg.theme);
    shadow.appendChild(style);
    return shadow;
  }

  function mountOne(host, cfg, latest, prev) {
    var shadow = prepareShadow(host, cfg);
    render(
      shadow,
      latest,
      computeTrend(latest, prev, 'gasoline'),
      computeTrend(latest, prev, 'diesel'),
      cfg
    );
    animateNumbers(shadow, cfg);
  }

  function mountError(host, cfg) {
    renderError(prepareShadow(host, cfg), cfg);
  }

  // ---------- init ----------
  function init() {
    var scriptCfg, hosts;
    try {
      scriptCfg = readScriptConfig();
      hosts = resolveMounts(scriptCfg);
    } catch (_) {
      return; // If config itself blows up, silently bail — never break host page.
    }
    if (!hosts.length) return;

    // Different hosts could in principle pass different data-api overrides.
    // Group by {latestUrl|historyUrl} so each distinct API is fetched once.
    var groups = {};
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      var cfg = mergeConfig(scriptCfg, host);
      var key = cfg.latestUrl + '|' + cfg.historyUrl;
      if (!groups[key]) groups[key] = { latestUrl: cfg.latestUrl, historyUrl: cfg.historyUrl, pairs: [] };
      groups[key].pairs.push({ host: host, cfg: cfg });
    }

    Object.keys(groups).forEach(function (k) { loadGroup(groups[k]); });
  }

  function loadGroup(group) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var signal = controller ? controller.signal : undefined;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

    fetchLatest(group.latestUrl, signal)
      .then(function (latest) {
        // History is best-effort; its own internal catch keeps this chain alive.
        return fetchPrevious(group.historyUrl, signal).then(function (prev) {
          clearTimeout(timer);
          group.pairs.forEach(function (p) { mountOne(p.host, p.cfg, latest, prev); });
        });
      })
      .catch(function (err) {
        clearTimeout(timer);
        group.pairs.forEach(function (p) { mountError(p.host, p.cfg); });
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[fuel-widget] render failed:', err && err.message ? err.message : err);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
