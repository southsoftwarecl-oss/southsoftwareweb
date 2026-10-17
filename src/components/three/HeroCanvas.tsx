'use client';
/**
 * Carga diferida del 3D (three + R3F van en un chunk aparte).
 * - Desktop: se importa justo después de la intro del preloader (en idle).
 * - Móvil / equipos modestos / ahorro de datos: se espera a la primera
 *   interacción o a que la página quede ociosa unos segundos; mientras tanto se
 *   ve un placeholder estático del logotipo en puntos (CSS, costo ~0).
 * - Sin WebGL → fallback con degradado.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { onIntro } from '@/lib/runtime';
import type { LOGO_LINES } from './ParticleScene';

const ParticleScene = dynamic(() => import('./ParticleScene'), { ssr: false });

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
/** Chequeo barato (sin crear un contexto: eso cuesta ~40 ms en móviles). R3F maneja el fallo real. */
const hasWebGL = () => typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window);
const noop = () => () => {};
function isLowEnd() {
  const n = navigator as Nav;
  return innerWidth < 760 || (n.hardwareConcurrency || 8) <= 4 || (n.deviceMemory || 8) <= 4 || !!n.connection?.saveData;
}

export default function HeroCanvas({ font, lines }: { font: string; lines?: typeof LOGO_LINES }) {
  const [ready, setReady] = useState(false);
  // Capacidades del dispositivo (constantes): en SSR se asume WebGL y equipo normal
  const ok = useSyncExternalStore(noop, hasWebGL, () => true);
  const low = useSyncExternalStore(noop, isLowEnd, () => false);

  useEffect(() => {
    if (!hasWebGL()) return;
    let cancel = false; const off: (() => void)[] = [];
    const go = () => { if (!cancel) setReady(true); };
    type RIC = (cb: () => void, o?: { timeout: number }) => number;
    const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
    const idle = (ms: number) => (ric ? ric(go, { timeout: ms }) : window.setTimeout(go, 50));

    if (isLowEnd()) {
      // primera interacción o 3,5 s después de `load`
      const evs = ['pointerdown', 'touchstart', 'scroll', 'keydown', 'mousemove'];
      const trigger = () => { evs.forEach((e) => window.removeEventListener(e, trigger)); go(); };
      evs.forEach((e) => window.addEventListener(e, trigger, { passive: true, once: true }));
      off.push(() => evs.forEach((e) => window.removeEventListener(e, trigger)));
      const later = () => { const t = window.setTimeout(() => idle(1500), 3500); off.push(() => clearTimeout(t)); };
      if (document.readyState === 'complete') later(); else { window.addEventListener('load', later, { once: true }); off.push(() => window.removeEventListener('load', later)); }
    } else {
      off.push(onIntro(() => idle(400)));
    }
    return () => { cancel = true; off.forEach((f) => f()); };
  }, []);

  if (!ok) return <div className="gl-fallback" aria-hidden="true" />;
  return (
    <>
      {low && <div className={`gl-ph${ready ? ' out' : ''}`} aria-hidden="true">{(lines ?? [{ text: 'SOUTH' }, { text: 'SOFTWARE' }]).map((l, i) => <span key={i}>{l.text}</span>)}</div>}
      {ready && <ParticleScene font={font} lines={lines} />}
    </>
  );
}
