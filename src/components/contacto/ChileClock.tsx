'use client';
/**
 * Hora de Chile en vivo (Intl, zona America/Santiago). Es un dato real, no un horario de atención.
 * El SSR pinta "--:--:--" (sin hora del servidor → sin desajuste de hidratación); se actualiza
 * cada segundo también con movimiento reducido (no es una animación).
 */
import { useEffect, useState } from 'react';

export default function ChileClock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const f = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => setT(f.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="cclock mono">
      <span className="cc-l">Hora de Chile</span> <time className="cc-t" suppressHydrationWarning>{t ?? '--:--:--'}</time>
    </span>
  );
}
