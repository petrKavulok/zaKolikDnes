'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// SSR-safe useLayoutEffect — branched at module load so React doesn't log
// "useLayoutEffect does nothing on the server" during server rendering.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Renders a number and, on mount, tweens the displayed value from 0 up to
 * `value` over 600 ms using an ease-out cubic curve — matching the embeddable
 * widget's animation (public/widget.js).
 *
 * SSR renders the final value directly (so crawlers and no-JS users see the
 * real price). On hydration we reset display to 0 via useLayoutEffect, which
 * runs synchronously before the next paint, keeping the visual jump to 0 as
 * brief as possible. Respects prefers-reduced-motion.
 */
export function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    setDisplay(0);

    const duration = 600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(p < 1 ? value * eased : value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toFixed(2)}</>;
}
