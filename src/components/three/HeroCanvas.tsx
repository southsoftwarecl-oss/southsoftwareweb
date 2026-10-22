'use client';
/**
 * Carga del 3D (three + R3F van en un chunk aparte), sin póster: el chunk se pide al hidratar en todos los
 * equipos y las partículas arman el logo desde el primer cuadro sobre fondo oscuro. El LCP es el H1.
 * - Móvil / equipos modestos: mismo arranque inmediato, con menos partículas (tiers.ts).
 * - Sin WebGL → fallback con degradado.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { LOGO_LINES } from './ParticleScene';
import type { Tokens } from './engine';
import { detectTier, type Tier } from './tiers';

const loadScene = () => import('./ParticleScene');
const ParticleScene = dynamic(loadScene, { ssr: false });

/** Chequeo barato (sin crear un contexto: eso cuesta ~40 ms en móviles). R3F maneja el fallo real. */
const hasWebGL = () => typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window);
const noop = () => () => {};
/** Lee los tokens de color del CSS (:root) para que el 3D no tenga hex propios. */
function readTokens(): Tokens {
  const cs = getComputedStyle(document.documentElement), v = (k: string) => cs.getPropertyValue(k).trim();
  return { bg: v('--bg'), accent: v('--accent'), deep: v('--accent-deep'), chrome1: v('--chrome-1'), chrome2: v('--chrome-2'), chrome3: v('--chrome-3') };
}

export default function HeroCanvas({ font, lines }: { font: string; lines?: typeof LOGO_LINES }) {
  const [boot, setBoot] = useState<{ tier: Tier; tokens: Tokens } | null>(null);
  const [ready, setReady] = useState(false);
  // Capacidades del dispositivo (constantes): en SSR se asume WebGL
  const ok = useSyncExternalStore(noop, hasWebGL, () => true);

  useEffect(() => {
    if (!hasWebGL()) return;
    // Sin póster: three se carga de inmediato en todos los equipos (el tier define la cantidad de partículas).
    // El chunk se pide en paralelo y la escena se monta en el siguiente idle corto, sin bloquear el LCP (el H1).
    let cancel = false;
    loadScene().catch(() => {});
    const go = () => { if (!cancel) setBoot({ tier: detectTier(), tokens: readTokens() }); };
    type RIC = (cb: () => void, o?: { timeout: number }) => number;
    const ric = (window as Window & { requestIdleCallback?: RIC }).requestIdleCallback;
    if (ric) ric(go, { timeout: 300 }); else window.setTimeout(go, 50);
    return () => { cancel = true; };
  }, []);

  // Home: fondo oscuro hasta el primer cuadro (nunca una imagen estática). 404: texto en puntos mientras carga.
  if (!ok) return <div className="gl-fallback" aria-hidden="true" />;
  return (
    <>
      {lines && <div className={`gl-ph${ready ? ' out' : ''}`} aria-hidden="true">{lines.map((l, i) => <span key={i}>{l.text}</span>)}</div>}
      {boot && <ParticleScene font={font} lines={lines} tier={boot.tier} tokens={boot.tokens} onReady={() => setReady(true)} />}
    </>
  );
}
