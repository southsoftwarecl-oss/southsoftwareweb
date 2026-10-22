'use client';
/** Al hacer clic en un CTA con data-lead, registra la intención en /api/leads (sendBeacon, no bloquea el WhatsApp). */
import { useEffect } from 'react';

export default function LeadBeacon() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[data-lead]');
      if (!a) return;
      try {
        const body = JSON.stringify({ ...JSON.parse(a.getAttribute('data-lead') || '{}'), path: location.pathname });
        const blob = new Blob([body], { type: 'application/json' });
        if (!navigator.sendBeacon?.('/api/leads', blob)) fetch('/api/leads', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
      } catch { /* nunca bloquear el CTA */ }
    };
    document.addEventListener('click', on, { capture: true });
    return () => document.removeEventListener('click', on, { capture: true });
  }, []);
  return null;
}
