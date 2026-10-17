'use client';
/**
 * Carga diferida del 3D: el bundle de three/R3F se importa recién después de
 * la intro (o en idle), así no bloquea el primer pintado ni el LCP.
 * Sin WebGL → queda el fondo con degradado (fallback CSS `.gl-fallback`).
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { onIntro } from '@/lib/runtime';
import type { LOGO_LINES } from './ParticleScene';

const ParticleScene = dynamic(() => import('./ParticleScene'), { ssr: false });

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export default function HeroCanvas({ font, lines }: { font: string; lines?: typeof LOGO_LINES }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    if (!hasWebGL()) { setOk(false); return; }
    let cancel = false;
    const go = () => { if (!cancel) setReady(true); };
    const off = onIntro(() => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) ric(go, { timeout: 400 }); else setTimeout(go, 50);
    });
    return () => { cancel = true; off(); };
  }, []);
  if (!ok) return <div className="gl-fallback" aria-hidden="true" />;
  return ready ? <ParticleScene font={font} lines={lines} /> : null;
}
