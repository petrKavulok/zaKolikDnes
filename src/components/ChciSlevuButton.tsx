'use client';

import { useCallback, useRef, useState } from 'react';
import andrejko from '@/assets/andrejko.png';
import alca from '@/assets/alca.png';

const sources = [andrejko.src, alca.src];

export function ChciSlevuButton({ source = 'main' }: { source?: 'main' | 'embed' } = {}) {
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);

  const spawn = useCallback(() => {
    fetch('/api/clicks/sleva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
      keepalive: true,
    }).catch(() => {});

    const container = document.querySelector('.floaters');
    if (!container) return;

    const img = document.createElement('img');
    img.src = sources[Math.floor(Math.random() * sources.length)];
    img.alt = '';

    const x = Math.random() * 90;
    const y = Math.random() * 90;
    const size = 60 + Math.random() * 60;
    const dx = -25 + Math.random() * 50;
    const dy = -30 + Math.random() * 60;
    const dur = 16 + Math.random() * 12;
    const rot = -20 + Math.random() * 40;

    img.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      opacity: 0.35;
      will-change: translate, rotate;
      rotate: ${rot}deg;
      --dx: ${dx}px;
      --dy: ${dy}px;
      animation: float ${dur}s infinite ease-in-out;
    `;

    container.appendChild(img);

    if (timeout.current) clearTimeout(timeout.current);
    setPhase('in');
    timeout.current = setTimeout(() => {
      setPhase('out');
      timeout.current = setTimeout(() => setPhase('idle'), 300);
    }, 1200);
  }, [source]);

  return (
    <button
      onClick={spawn}
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
    >
      {phase !== 'idle' && (
        <svg
          className={`h-4 w-4 ${phase === 'in' ? 'animate-[checkpop_0.3s_ease-out_forwards]' : 'animate-[checkpopout_0.3s_ease-in_forwards]'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12l6 6L20 6" className="animate-[checkdraw_0.3s_ease-out_forwards]" style={{ strokeDasharray: 30, strokeDashoffset: 0 }} />
        </svg>
      )}
      Chci slevu
    </button>
  );
}
