'use client';
/**
 * MotionRoot / RouteMotion — puentes React hacia lib/motion-runtime.ts.
 * El runtime (GSAP + Lenis) se importa de forma diferida tras la hidratación,
 * así no alarga la primera carga. Ver lib/motion-runtime.ts para el detalle.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Carga el runtime después del primer pintado (FCP): el texto del hero se
 * pinta sin esperar a GSAP/Lenis. El preloader CSS cubre ese intervalo.
 */
let afterPaint: Promise<void> | null = null;
function firstPaint() {
  return (afterPaint ??= new Promise<void>((res) => {
    if (performance.getEntriesByName('first-contentful-paint').length) return res();
    const t = window.setTimeout(res, 800);
    try {
      new PerformanceObserver((l, o) => { if (l.getEntries().length) { o.disconnect(); clearTimeout(t); res(); } })
        .observe({ type: 'paint', buffered: true });
    } catch { /* navegador sin PerformanceObserver: usa el timeout */ }
  }));
}
const load = () => firstPaint().then(() => import('@/lib/motion-runtime'));

/** Hook: ejecuta `start` del runtime cuando carga y limpia al desmontar. */
function useRuntime(start: (m: Awaited<ReturnType<typeof load>>) => () => void, deps: unknown[]) {
  useEffect(() => {
    let alive = true;
    let cleanup: (() => void) | undefined;
    // cada arranque en su propia tarea: evita una tarea larga única tras la carga
    load().then((m) => setTimeout(() => { if (alive) cleanup = start(m); }, 0));
    return () => { alive = false; cleanup?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Runtime global (se monta una vez en el layout). */
export default function MotionRoot() {
  useRuntime((m) => m.startGlobal(), []);
  return null;
}

/**
 * Animaciones por ruta. Se monta DENTRO de cada página (ver Page.tsx) para que su
 * efecto corra recién cuando el contenido de la página ya está hidratado
 * (SplitText modifica el DOM; hacerlo antes rompería la hidratación).
 * Todas las consultas se limitan a ESTA página: Next mantiene las páginas
 * visitadas montadas pero ocultas (Activity), así que document.* encontraría duplicados.
 */
export function RouteMotion() {
  const pathname = usePathname();
  const anchor = useRef<HTMLElement>(null);
  useRuntime((m) => m.startRoute((anchor.current?.parentElement as HTMLElement) || document.body), [pathname]);
  return <i ref={anchor} hidden aria-hidden="true" />;
}
