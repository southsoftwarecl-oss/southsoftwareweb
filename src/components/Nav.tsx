'use client';
/**
 * Navegación: logo + píldora con links + CTA (idéntico al preview).
 * En ≤760px la píldora se oculta (como en el preview) y aparece un botón
 * "Menú" que abre un overlay a pantalla completa (Framer Motion).
 */
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NAV } from '@/content/site';
import { Btn } from './ui';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const isActive = (href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(href + '/'));
  const ctaHref = pathname === '/' ? '#contacto' : '/contacto';

  return (
    <header className="nav">
      <div className="bar">
        <Link className="logo" href="/" aria-label="South Software, inicio">
          <Image src="/brand/logo.png" alt="South Software" width={600} height={187} priority sizes="97px" />
        </Link>
        <nav aria-label="Principal">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className={isActive(l.href) ? 'on' : undefined}>{l.label}</Link>
          ))}
        </nav>
        <div className="nav-r">
          <Btn href={ctaHref} variant="light" icon={false}>Agenda una reunión</Btn>
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((v) => !v)}>
            <i /><i />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div id="menu-movil" className="mmenu" role="dialog" aria-modal="true" aria-label="Menú"
            initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE }}>
            <nav aria-label="Menú móvil">
              {[{ href: '/', label: 'Inicio' }, ...NAV].map((l, i) => (
                <motion.div key={l.href} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.9, ease: EASE }} className="mm-row">
                  <Link href={l.href} onClick={() => setOpen(false)}><span className="mono">0{i + 1}</span>{l.label}</Link>
                </motion.div>
              ))}
            </nav>
            <p className="mono mm-foot">Puerto Montt · Chile</p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
