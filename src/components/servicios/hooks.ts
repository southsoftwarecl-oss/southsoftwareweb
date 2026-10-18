'use client';
/** Hooks de /servicios: media queries con useSyncExternalStore (sin setState en efectos). */
import { useSyncExternalStore } from 'react';

function mq(query: string) {
  const subscribe = (cb: () => void) => {
    const m = matchMedia(query);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  };
  return subscribe;
}
const subReduced = mq('(prefers-reduced-motion: reduce)');
/** true con prefers-reduced-motion (o ?capture: frames finales estáticos para capturas). */
export function useReducedMotion() {
  return useSyncExternalStore(subReduced, () => matchMedia('(prefers-reduced-motion: reduce)').matches || /capture/.test(location.search + location.hash), () => false);
}
export const isReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || /capture/.test(location.search + location.hash);

const subNarrow = mq('(max-width: 1024px)');
/** true bajo 1025 px (acordeón / lista compacta). En SSR: false (escritorio). */
export function useNarrow() {
  return useSyncExternalStore(subNarrow, () => matchMedia('(max-width: 1024px)').matches, () => false);
}

const subHash = (cb: () => void) => {
  addEventListener('hashchange', cb); addEventListener('popstate', cb);
  return () => { removeEventListener('hashchange', cb); removeEventListener('popstate', cb); };
};
/** location.hash sin "#" ('' en SSR). */
export function useHash() {
  return useSyncExternalStore(subHash, () => decodeURIComponent(location.hash.slice(1)), () => '');
}
