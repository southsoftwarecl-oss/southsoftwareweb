'use client';
/** WhatsApp flotante único (aparece tras el hero vía MotionRoot) y se oculta cuando el footer entra en pantalla. */
import { useEffect, useRef } from 'react';
import { waLink } from '@/content/site';
import { WaIcon } from './ui';

export default function WaFloat() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const ft = document.querySelector('footer');
    if (!ft || !ref.current) return;
    const io = new IntersectionObserver(([e]) => ref.current?.classList.toggle('over-ft', e.isIntersecting));
    io.observe(ft);
    return () => io.disconnect();
  }, []);
  return (
    <aside aria-label="WhatsApp" className="wa-float-wrap">
    <a ref={ref} className="wa-float" href={waLink('Hola, quiero cotizar un proyecto con South Software')} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp">
      <span className="wa-ic"><WaIcon /></span><span className="wa-lb" aria-hidden="true">Escríbenos</span>
    </a>
    </aside>
  );
}
