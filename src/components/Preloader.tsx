'use client';
/**
 * Preloader (≤1,5 s): el logotipo se dibuja con trazos, se rellena y la cortina
 * se abre hacia arriba. Es 100 % CSS (ver globals.css → "Preloader") para que
 * empiece en el primer pintado aunque el JS aún no haya cargado; MotionRoot lee
 * el tiempo de la animación para disparar la intro del hero en el momento justo.
 * Al terminar se desmonta. No se muestra con prefers-reduced-motion ni en ?capture.
 */
import { useState } from 'react';

export default function Preloader() {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <div
      className="pre"
      aria-hidden="true"
      onAnimationEnd={(e) => { if (e.target === e.currentTarget && e.animationName === 'pre-out') setGone(true); }}
    >
      <svg viewBox="0 0 600 170">
        <text x="300" y="72" textAnchor="middle" fontSize="64">SOUTH</text>
        <text x="300" y="148" textAnchor="middle" fontSize="46" letterSpacing="4">SOFTWARE</text>
      </svg>
      <div className="bar"><b /></div>
    </div>
  );
}
