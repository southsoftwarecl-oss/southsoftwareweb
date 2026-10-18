'use client';
/** Botón "Copiar" del email: navigator.clipboard + check que se dibuja + toast "Copiado" (aria-live polite). */
import { useEffect, useRef, useState } from 'react';

export default function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'ko'>('idle');
  const t = useRef(0);
  useEffect(() => () => clearTimeout(t.current), []);
  async function copy() {
    try { await navigator.clipboard.writeText(email); setState('ok'); }
    catch { setState('ko'); }
    clearTimeout(t.current);
    t.current = window.setTimeout(() => setState('idle'), 2400);
  }
  return (
    <span className="copy-wrap">
      <button type="button" className={`copy${state === 'ok' ? ' ok' : ''}`} onClick={copy} aria-label="Copiar email">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect className="cp-doc" x="8" y="8" width="12" height="12" rx="2" /><path className="cp-doc" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          <path className="cp-chk" pathLength={1} d="m7 12.5 3.2 3.2L17 9" />
        </svg>
        <span>Copiar</span>
      </button>
      <span className={`toast${state !== 'idle' ? ' on' : ''}`} aria-live="polite" role="status">
        {state === 'ok' ? 'Copiado' : state === 'ko' ? 'No se pudo copiar' : ''}
      </span>
    </span>
  );
}
