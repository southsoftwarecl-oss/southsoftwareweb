/**
 * Estado compartido del runtime de animación (cliente).
 * Equivale al objeto global `SS` del preview: flags de modo, mouse e intro.
 */
export type Runtime = {
  capture: boolean; // ?capture → modo captura (sin preloader/Lenis, todo visible)
  reduced: boolean; // prefers-reduced-motion
  static: boolean; // capture || reduced
  introduced: boolean;
  lateIntro: boolean; // el JS llegó después de que terminó el preloader
  mouse: { x: number; y: number; nx: number; ny: number; moved: boolean };
};

export const RT: Runtime = {
  capture: false, reduced: false, static: false, introduced: false, lateIntro: false,
  mouse: { x: 0, y: 0, nx: 0, ny: 0, moved: false },
};

let detected = false;
/** Detecta modos una sola vez (llamar solo en el cliente). */
export function detectModes() {
  if (detected || typeof window === 'undefined') return RT;
  detected = true;
  RT.capture = /capture/.test(location.hash) || /capture/.test(location.search);
  RT.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  RT.static = RT.capture || RT.reduced;
  RT.mouse.x = innerWidth / 2; RT.mouse.y = innerHeight / 2;
  return RT;
}

/* ---------- Intro: se dispara cuando el preloader se abre ---------- */
const introListeners = new Set<() => void>();
export function onIntro(fn: () => void) {
  if (RT.introduced) { fn(); return () => {}; }
  introListeners.add(fn);
  return () => { introListeners.delete(fn); };
}
export function fireIntro() {
  if (RT.introduced) return;
  RT.introduced = true;
  introListeners.forEach((f) => f());
  introListeners.clear();
}

/** DPR limitado como en el preview (1.75; 1.5 en móvil). */
export const capDpr = () => Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 1.75);
