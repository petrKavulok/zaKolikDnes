'use client';

import { useEffect, useRef } from 'react';
import { REGULATION_ENDED_ISO } from '@/lib/constants';

const STORAGE_KEY = 'regulation-ended-dialog-dismissed';

export function RegulationEndedDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    ref.current?.showModal();
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      className="regulation-ended-dialog w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-slate-900 p-6 text-slate-100 shadow-2xl ring-1 ring-white/10"
      aria-labelledby="regulation-ended-title"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
        Důležité oznámení
      </p>
      <h2 id="regulation-ended-title" className="mt-2 text-xl font-semibold text-white">
        Regulace cen pohonných hmot skončila
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        Ministerstvo financí ČR zrušilo cenovou regulaci pohonných hmot ke dni{' '}
        <time dateTime={REGULATION_ENDED_ISO}>19.&nbsp;července&nbsp;2026</time>.
        Od 20.&nbsp;července se ceny benzínu a nafty řídí tržními mechanismy —
        oficiální maximální ceny se již nezveřejňují.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Tento web nadále zobrazuje historická data z období regulace. Graf končí
        posledním dnem platnosti stropů.
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Rozumím
        </button>
      </div>
    </dialog>
  );
}
