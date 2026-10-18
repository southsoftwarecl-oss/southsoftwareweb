'use client';
/**
 * Motor común de las mini-demos:
 * - construye UN timeline maestro (loop 6–8 s) dentro de un gsap.context limitado a la demo,
 * - lo pausa fuera del viewport (IntersectionObserver) y con el botón de pausa (WCAG 2.2.2),
 * - con prefers-reduced-motion no crea nada: el marcado por defecto ES el frame final.
 * El estado queda en data-anim="running|paused|static" (lo leen los tests e2e).
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { gsap, setupGsap } from '@/lib/gsap';
import { isReduced } from '../hooks';

export type DemoBuild = (g: typeof gsap, root: HTMLElement) => gsap.core.Timeline | null | void;

const live = new Set<gsap.core.Timeline>();
if (typeof window !== 'undefined') {
  // QA: cuántos timelines de demo están corriendo ahora mismo
  (window as unknown as { __svDemoLive: () => number }).__svDemoLive = () => [...live].filter((t) => t.isActive()).length;
}

export function useDemo(root: RefObject<HTMLDivElement | null>, build: DemoBuild) {
  const [paused, setPaused] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const st = useRef({ user: false, inView: true });
  const buildRef = useRef(build);
  const applyRef = useRef<() => void>(() => {});
  useEffect(() => { buildRef.current = build; });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (isReduced()) { el.setAttribute('data-anim', 'static'); return; }
    setupGsap();
    const ctx = gsap.context(() => { tl.current = buildRef.current(gsap, el) || null; }, el);
    const t = tl.current;
    if (t) live.add(t);
    const apply = () => {
      const run = !st.current.user && st.current.inView;
      if (t) { if (run) t.resume(); else t.pause(); }
      el.setAttribute('data-anim', run ? 'running' : 'paused');
    };
    const io = new IntersectionObserver(([e]) => { st.current.inView = e.isIntersecting; apply(); }, { threshold: 0.1 });
    io.observe(el);
    apply();
    applyRef.current = apply;
    return () => { io.disconnect(); if (t) live.delete(t); ctx.revert(); tl.current = null; };
  }, [root]);

  const toggle = () => {
    st.current.user = !st.current.user;
    setPaused(st.current.user);
    applyRef.current();
  };
  return { paused, toggle, tl, isUserPaused: () => st.current.user };
}
