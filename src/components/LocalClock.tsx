'use client';
/**
 * Hora de Chile REAL (Intl, zona America/Santiago). No es un horario de atención.
 * El SSR pinta "--:--:--" (sin hora del servidor → sin desajuste de hidratación ni datos cacheados);
 * se actualiza cada segundo también con movimiento reducido (no es una animación).
 */
import { useEffect, useState } from 'react';

const fmt = () => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export default function LocalClock({ className = '' }: { className?: string }) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const f = fmt();
    const tick = () => setT(f.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`lclock ${className}`.trim()}>
      <span className="lc-l">Hora de Chile</span>{' '}
      <time className="lc-t" suppressHydrationWarning>{t ?? '--:--:--'}</time>
    </span>
  );
}
