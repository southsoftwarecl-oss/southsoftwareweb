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
import type { Tokens } from './engine';
import { detectTier, type Tier } from './tiers';

const loadScene = () => import('./ParticleScene');
const ParticleScene = dynamic(loadScene, { ssr: false });

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
/** Chequeo barato (sin crear un contexto: eso cuesta ~40 ms en móviles). R3F maneja el fallo real. */
const hasWebGL = () => typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window);
const noop = () => () => {};
function isLowEnd() {
  const n = navigator as Nav;
  return innerWidth < 760 || (n.hardwareConcurrency || 8) <= 4 || (n.deviceMemory || 8) <= 4 || !!n.connection?.saveData;
}

/** Lee los tokens de color del CSS (:root) para que el 3D no tenga hex propios. */
function readTokens(): Tokens {
  const cs = getComputedStyle(document.documentElement), v = (k: string) => cs.getPropertyValue(k).trim();
  return { bg: v('--bg'), accent: v('--accent'), deep: v('--accent-deep'), chrome1: v('--chrome-1'), chrome2: v('--chrome-2'), chrome3: v('--chrome-3') };
}

export default function HeroCanvas({ font, lines }: { font: string; lines?: typeof LOGO_LINES }) {
  const [boot, setBoot] = useState<{ tier: Tier; tokens: Tokens } | null>(null);
  const [ready, setReady] = useState(false);
  // Capacidades del dispositivo (constantes): en SSR se asume WebGL y equipo normal
  const ok = useSyncExternalStore(noop, hasWebGL, () => true);

  useEffect(() => {
    if (!hasWebGL()) return;
    let cancel = false; const off: (() => void)[] = [];
    const go = () => { if (!cancel) setBoot({ tier: detectTier(), tokens: readTokens() }); };
    type RIC = (cb: () => void, o?: { timeout: number }) => number;
    const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
    const idle = (ms: number) => (ric ? ric(go, { timeout: ms }) : window.setTimeout(go, 50));
    // descarga el chunk de three en paralelo (sin bloquear el render)
    const pre = () => { loadScene().catch(() => {}); };
    if (ric) ric(pre, { timeout: 600 }); else window.setTimeout(pre, 200);

    if (isLowEnd()) {
      // primera interacción o poco después de `load`
      const evs = ['pointerdown', 'touchstart', 'scroll', 'keydown', 'mousemove'];
      const trigger = () => { evs.forEach((e) => window.removeEventListener(e, trigger)); go(); };
      evs.forEach((e) => window.addEventListener(e, trigger, { passive: true, once: true }));
      off.push(() => evs.forEach((e) => window.removeEventListener(e, trigger)));
      const later = () => { const t = window.setTimeout(() => idle(600), 300); off.push(() => clearTimeout(t)); };
      if (document.readyState === 'complete') later(); else { window.addEventListener('load', later, { once: true }); off.push(() => window.removeEventListener('load', later)); }
    } else {
      off.push(onIntro(() => idle(150)));
    }
    return () => { cancel = true; off.forEach((f) => f()); };
  }, []);

  if (!ok) return <div className="gl-fallback" aria-hidden="true" />;
  return (
    <>
      <div className={`gl-ph${ready ? ' out' : ''}`} aria-hidden="true">{(lines ?? [{ text: 'SOUTH' }, { text: 'SOFTWARE' }]).map((l, i) => <span key={i}>{l.text}</span>)}</div>
      {boot && <ParticleScene font={font} lines={lines} tier={boot.tier} tokens={boot.tokens} onReady={() => setReady(true)} />}
    </>
  );
}
