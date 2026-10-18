/**
 * Motion de /contacto (cargado con import() en idle desde BriefStudio).
 * Gota de los chips, indicador de presupuesto (Flip), entrada de valores del brief,
 * vibración del riel con error y "sello" del brief (brillo → sobre → MotionPath).
 * Solo transform, opacity, clip-path y strokeDashoffset. Con reduced motion todo es no-op.
 */
import { gsap, Flip, setupGsap } from '@/lib/gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

setupGsap();
gsap.registerPlugin(MotionPathPlugin);

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hook de test: animaciones GSAP activas en la página (globales, incluye el runtime).
if (typeof window !== 'undefined') {
  (window as unknown as { __contactMotion: object }).__contactMotion = {
    active: () => gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).length,
  };
}

/** "Gota" de --accent-fill que se expande desde (x, y) en coordenadas del chip. */
export function drop(fill: HTMLElement, x: number, y: number) {
  if (reduced()) return;
  const { width: w, height: h } = fill.getBoundingClientRect();
  const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;
  gsap.fromTo(fill, { clipPath: `circle(0px at ${x}px ${y}px)` },
    { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.5, ease: 'mercury', overwrite: true, clearProps: 'clipPath' });
}

export type FlipState = ReturnType<typeof Flip.getState>;
export const flipState = (sel: string) => Flip.getState(sel);
/** Indicador de cromo del presupuesto: se desliza desde su posición anterior. */
export function flipFrom(state: FlipState, target: Element) {
  if (reduced()) return;
  if (!state.elementStates.length) {
    gsap.fromTo(target, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'south', clearProps: 'opacity,transform' });
    return;
  }
  Flip.from(state, { targets: target, duration: 0.5, ease: 'south', scale: true, clearProps: 'transform' });
}

/** Valor nuevo en la tarjeta del brief: sube desde su máscara. */
export function enter(el: Element) {
  if (reduced()) return;
  gsap.fromTo(el, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'south', overwrite: true, clearProps: 'transform,opacity' });
}

/** Vibración del riel con error: x ±4 px, 3 ciclos en 0.3 s. */
export function shake(els: Element[]) {
  if (reduced() || !els.length) return;
  gsap.fromTo(els, { x: 0 }, { keyframes: { x: [0, -4, 4, -4, 4, -4, 4, 0] }, duration: 0.3, ease: 'none', overwrite: true, clearProps: 'transform' });
}

/** Check que se dibuja (strokeDashoffset 1 → 0; el path usa pathLength=1). */
export function drawCheck(path: SVGPathElement | null) {
  if (!path || reduced()) return;
  gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'south' });
}

/**
 * Sella la tarjeta: barrido de brillo → se pliega en sobre (solapa rotateX -180° → 0,
 * perspective 1000) → viaja arriba a la derecha con MotionPath (1.1 s, 'mercury').
 */
export function seal(card: HTMLElement): Promise<void> {
  if (reduced()) return Promise.resolve();
  const shine = card.querySelector('.bc-shine i');
  const body = card.querySelector('.bc-body');
  const env = card.querySelector('.bc-env');
  const flap = card.querySelector('.bc-flap');
  const r = card.getBoundingClientRect();
  const dx = Math.max(160, innerWidth - r.right + r.width * 0.25);
  const dy = -Math.max(220, r.bottom);
  return new Promise((done) => {
    const tl = gsap.timeline({ onComplete: () => done(), defaults: { ease: 'south' } });
    tl.set(card, { transformPerspective: 1000 })
      .fromTo(shine, { xPercent: -120, opacity: 1 }, { xPercent: 120, duration: 0.5, ease: 'power2.inOut' })
      .to(body, { opacity: 0, scale: 0.96, duration: 0.25 }, '-=0.1')
      .fromTo(env, { opacity: 0 }, { opacity: 1, duration: 0.2 }, '<')
      .fromTo(flap, { rotationX: -180 }, { rotationX: 0, transformOrigin: '50% 0%', transformPerspective: 1000, duration: 0.4, ease: 'power3.inOut' })
      .to(card, { scale: 0.42, duration: 0.3, ease: 'south-in' })
      .to(card, {
        duration: 1.1, ease: 'mercury',
        motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.35, y: dy * 0.15 }, { x: dx, y: dy }], curviness: 1.4 },
        rotation: 8,
      })
      .to(card, { opacity: 0, duration: 0.3, ease: 'south-in' }, '-=0.35');
  });
}

/** Vuelve a mostrar la tarjeta (ya en estado "Recibido") en su lugar. */
export function settle(card: HTMLElement) {
  gsap.set(card, { clearProps: 'all' });
  card.querySelectorAll('.bc-body,.bc-env,.bc-flap,.bc-shine i').forEach((el) => gsap.set(el, { clearProps: 'all' }));
  if (reduced()) return;
  gsap.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'mercury', clearProps: 'opacity,transform' });
}
