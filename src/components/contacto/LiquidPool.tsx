'use client';
/**
 * "Charco" de metal líquido detrás del formulario (reemplaza el .glow de .final):
 * gradiente cónico de cromo que rota en 40 s (solo transform, CSS), opacity ≤ .12.
 * Se pausa fuera de pantalla (IntersectionObserver) y NO existe con reduced motion.
 */
import { useEffect, useRef, useState } from 'react';

export default function LiquidPool() {
  const ref = useRef<HTMLDivElement>(null);
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setRm(mq.matches);
    sync(); mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || rm) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('run', e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [rm]);
  if (rm) return null;
  return <div className="pool" ref={ref} aria-hidden="true"><i /></div>;
}
