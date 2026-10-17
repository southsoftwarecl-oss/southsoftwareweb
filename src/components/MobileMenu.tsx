'use client';
/**
 * Overlay del menú móvil (Framer Motion: clip-path + filas escalonadas).
 * Nav lo carga de forma diferida al primer toque del botón "Menú".
 */
import Link from 'next/link';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { NAV } from '@/content/site';

const EASE = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.7, 0, 0.84, 0] as const; // 'south-in' para salidas

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open && (
          <m.div id="menu-movil" className="mmenu" role="dialog" aria-modal="true" aria-label="Menú"
            initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.5, ease: EASE_IN } }}
            transition={{ duration: 0.7, ease: EASE }}>
            <nav aria-label="Menú móvil">
              {[{ href: '/', label: 'Inicio' }, ...NAV].map((l, i) => (
                <m.div key={l.href} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.9, ease: EASE }} className="mm-row">
                  <Link href={l.href} onClick={onClose}><span className="mono">0{i + 1}</span>{l.label}</Link>
                </m.div>
              ))}
            </nav>
            <p className="mono mm-foot">Puerto Montt · Chile</p>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
