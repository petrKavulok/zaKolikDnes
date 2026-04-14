const CZECH_DAYS = ['neděli', 'pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek', 'sobotu'] as const;
// Genitive: "od neděle / pondělí / úterý / středy / čtvrtka / pátku / soboty"
const CZECH_DAYS_GEN = ['neděle', 'pondělí', 'úterý', 'středy', 'čtvrtka', 'pátku', 'soboty'] as const;
// "než v pondělí" but "než ve středu / ve čtvrtek / v pátek"
const CZECH_DAYS_COMPARE = ['než v neděli', 'než v pondělí', 'než v úterý', 'než ve středu', 'než ve čtvrtek', 'než v pátek', 'než v sobotu'] as const;

/**
 * Format an ISO date string for display.
 * - Pure date "YYYY-MM-DD" → "soboty, 11.4.2026" (with day name, no leading zeros)
 * - Datetime "YYYY-MM-DD HH:MM:SS" → "11.4.2026" (no day name for timestamps)
 * Returns the original input if it can't be parsed.
 */
export function formatDate(input: string | null | undefined): string {
  if (!input) return '';
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return input;
  const [, y, m, d] = match;
  const dateStr = `${Number(d)}.${Number(m)}.${y}`;
  // If the input is longer than just YYYY-MM-DD it's a timestamp — skip day name
  if (input.length > 10) return dateStr;
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  return `${CZECH_DAYS_GEN[date.getDay()]}, ${dateStr}`;
}

/** Today's date in Europe/Prague as YYYY-MM-DD. */
export function todayPrague(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });
}

/** Tomorrow's date in Europe/Prague as YYYY-MM-DD. */
export function tomorrowPrague(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });
}

/** Shift an ISO date string by ±N days. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid DST edge
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns e.g. "než včera" or "než v pátek" based on how the previous
 * effective date relates to the current one.
 */
export function previousPriceLabel(previousEffective: string): string {
  const prev = new Date(previousEffective + 'T12:00:00');
  const today = new Date(todayPrague() + 'T12:00:00');
  const daysAgo = Math.round((today.getTime() - prev.getTime()) / 86_400_000);

  if (daysAgo === 1) return 'než včera';
  return CZECH_DAYS_COMPARE[prev.getDay()];
}

/**
 * Human-readable label for when the next price update is expected.
 * New data is published Mon–Fri at 14:05 Prague time.
 */
export function nextUpdateLabel(): string {
  const now = new Date();
  const pragueNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const day = pragueNow.getDay(); // 0=Sun … 6=Sat
  const hour = pragueNow.getHours();
  const minute = pragueNow.getMinutes();
  const beforeUpdate = hour < 14 || (hour === 14 && minute < 5);

  // If it's a weekday and before 14:05, the next update is today
  if (day >= 1 && day <= 5 && beforeUpdate) {
    return 'dnes ve 14:05';
  }

  // Otherwise, find the next weekday
  let daysUntil: number;
  if (day === 5 && !beforeUpdate) {
    daysUntil = 3; // Friday after 14:00 → Monday
  } else if (day === 6) {
    daysUntil = 2; // Saturday → Monday
  } else if (day === 0) {
    daysUntil = 1; // Sunday → Monday
  } else {
    daysUntil = 1; // Weekday after 14:00 → next day
  }

  const nextDay = (day + daysUntil) % 7;
  return `v ${CZECH_DAYS[nextDay]} ve 14:05`;
}
