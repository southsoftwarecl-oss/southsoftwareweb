'use client';
/**
 * Wordmark del hero en SVG (texto real, nítido a cualquier DPR). Las letras se "ensamblan" al abrir el
 * preloader (GSAP: posición dispersa → su celda). Con movimiento reducido / ?capture queda estático.
 * Decorativo (aria-hidden): el nombre accesible ya está en el logo de la navegación.
 */
import { useEffect, useRef } from 'react';
import { detectModes, onIntro } from '@/lib/runtime';

const L1 = 'SOUTH'.split('');
const L2 = 'SOFTWARE'.split('');
const CELL = 100;

export default function HeroWordmark() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || detectModes().static) return;
    let off = () => {};
    let alive = true;
    import('@/lib/gsap').then(({ gsap }) => {
      if (!alive) return;
      const letters = Array.from(svg.querySelectorAll<SVGTextElement>('.hw-l'));
      const rule = svg.querySelector('.hw-rule');
      gsap.set(letters, { opacity: 0, y: (i) => ((i * 37) % 7 - 3) * 18, x: (i) => ((i * 53) % 5 - 2) * 14, rotate: (i) => ((i * 29) % 5 - 2) * 4, transformOrigin: '50% 50%' });
      gsap.set(rule, { scaleX: 0, transformOrigin: '50% 50%' });
      off = onIntro(() => {
        gsap.to(letters, { opacity: 1, x: 0, y: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: { each: 0.045, from: 'center' }, clearProps: 'transform' });
        gsap.to(rule, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', delay: 0.4 });
      });
    });
    return () => { alive = false; off(); };
  }, []);
  return (
    <svg ref={ref} className="hero-wm" viewBox="0 0 800 250" aria-hidden="true" focusable="false">
      <g className="hw-g">
        {L1.map((c, i) => <text key={`a${i}`} className="hw-l" x={200 + CELL * i + CELL / 2} y="92" textAnchor="middle">{c}</text>)}
        <line className="hw-rule" x1="40" x2="760" y1="128" y2="128" />
        {L2.map((c, i) => <text key={`b${i}`} className="hw-l" x={CELL * i + CELL / 2} y="222" textAnchor="middle">{c}</text>)}
      </g>
    </svg>
  );
}
