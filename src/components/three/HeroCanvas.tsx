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

/** Fundido póster → canvas: el canvas (opaco) entra ENCIMA del póster, que sigue al 100 % hasta que el canvas cubre
 *  todo; recién ahí se retira. Sin bajón de brillo ni salto. */
const HANDOFF_MS = 800;

/**
 * Póster estático del logo armado en partículas: es el LCP del primer paint. Se genera desde el PRIMER cuadro real del
 * canvas (scripts/hero-poster.mjs, `?gl=high&poster`), así que coincide en posición, escala, color y luz con lo que
 * dibuja el canvas al tomar el relevo. Cubre el 60 % superior del hero (todo el viewport haría que Chrome lo trate como
 * fondo y no como LCP); absoluto → CLS 0. Escalado igual que la cámara: en desktop por ALTO (FOV vertical fijo) y
 * centrado; en vertical por ANCHO (el encuadre del logo se ajusta al ancho).
 */
function Poster({ ready }: { ready: boolean }) {
  return (
    <div className={`gl-ph gl-poster${ready ? ' out' : ''}`} aria-hidden="true"><picture>
      <source media="(max-width: 759px)" type="image/avif" srcSet="/hero/poster-m.avif 1x, /hero/poster-m@2x.avif 2x" />
      <source media="(max-width: 759px)" type="image/webp" srcSet="/hero/poster-m.webp 1x, /hero/poster-m@2x.webp 2x" />
      <source type="image/avif" srcSet="/hero/poster-d.avif 1x, /hero/poster-d@2x.avif 2x" />
      <img src="/hero/poster-d.webp" srcSet="/hero/poster-d.webp 1x, /hero/poster-d@2x.webp 2x" alt="" width={1440} height={540} fetchPriority="high" decoding="async" />
    </picture></div>
  );
}

export default function HeroCanvas({ font, lines }: { font: string; lines?: typeof LOGO_LINES }) {
  const [boot, setBoot] = useState<{ tier: Tier; tokens: Tokens } | null>(null);
  const [ready, setReady] = useState(false);
  const [handed, setHanded] = useState(false); // el canvas ya cubre el póster (fin del fundido)
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
    if (isLowEnd()) {
      // primera interacción o poco después de `load`
      const evs = ['pointerdown', 'touchstart', 'scroll', 'keydown', 'mousemove'];
      const trigger = () => { evs.forEach((e) => window.removeEventListener(e, trigger)); go(); };
      evs.forEach((e) => window.addEventListener(e, trigger, { passive: true, once: true }));
      off.push(() => evs.forEach((e) => window.removeEventListener(e, trigger)));
      // (sin temporizador: el póster ya muestra el logo armado; three no compite con el LCP ni suma TBT)
    } else {
      // desktop: el chunk se baja en idle tras el LCP y la escena arranca al terminar la intro
      if (ric) ric(pre, { timeout: 1500 }); else window.setTimeout(pre, 600);
      off.push(onIntro(() => idle(150)));
    }
    return () => { cancel = true; off.forEach((f) => f()); };
  }, []);

  const poster = !lines; // el póster es el logo de la home (otras páginas usan su propio texto en puntos)
  if (!ok) return poster ? <Poster ready={false} /> : <div className="gl-fallback" aria-hidden="true" />;
  return (
    <>
      {poster ? <Poster ready={handed} /> : <div className={`gl-ph${ready ? ' out' : ''}`} aria-hidden="true">{lines.map((l, i) => <span key={i}>{l.text}</span>)}</div>}
      {boot && <ParticleScene font={font} lines={lines} tier={boot.tier} tokens={boot.tokens} fromPoster={poster} handoffMs={HANDOFF_MS}
        onReady={() => { setReady(true); if (poster) window.setTimeout(() => setHanded(true), HANDOFF_MS + 50); }} />}
    </>
  );
}
