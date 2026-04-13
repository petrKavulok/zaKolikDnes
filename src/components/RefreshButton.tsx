'use client';

// Dev/admin button: triggers POST /api/refresh and revalidates the page.
// The admin token is read from localStorage; the user is prompted once and
// the value is reused on subsequent clicks.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    let token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      token = window.prompt('Admin token (saved to localStorage):');
      if (!token) return;
      localStorage.setItem('adminToken', token);
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 401) localStorage.removeItem('adminToken');
        setMsg(`Error ${res.status}: ${body.error ?? 'failed'}`);
      } else {
        setMsg(
          `OK — discovered ${body.discovered}, known ${body.alreadyKnown}, processed ${body.processed?.length ?? 0}`,
        );
        router.refresh();
      }
    } catch (err) {
      setMsg(`Error: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 hidden">
      <button
        onClick={onClick}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex items-center gap-2 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {busy ? 'Fetching…' : 'Refresh prices'}
      </button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}
