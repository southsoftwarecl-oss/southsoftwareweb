'use client';
/**
 * Navegación: logo + píldora con links + CTA (idéntico al preview).
 * En ≤760px la píldora se oculta (como en el preview) y aparece un botón
 * "Menú" que abre un overlay a pantalla completa (Framer Motion).
 */
import Link from 'next/link';
import Logo from './Logo';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { NAV } from '@/content/site';
import { Btn } from './ui';

const MobileMenu = dynamic(() => import('./MobileMenu'), { ssr: false });

export default function Nav() {
  const pathname = usePathname();
  // El menú queda asociado a la ruta en que se abrió: al navegar se cierra solo
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const [loaded, setLoaded] = useState(false);
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenAt((typeof v === 'function' ? v(open) : v) ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenAt(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const isActive = (href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(href + '/'));
  const ctaHref = pathname === '/' ? '#contacto' : '/contacto';

  return (
    <header className="nav">
      <div className="bar">
        <Link className="logo" href="/" aria-label="South Software, inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} className={isActive(l.href) ? 'on' : undefined}>{l.label}</Link>
          ))}
        </nav>
        <div className="nav-r">
          <Btn href={ctaHref} variant="light" icon={false}>Agenda una reunión</Btn>
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => { setLoaded(true); setOpen((v) => !v); }}>
            <i /><i />
          </button>
        </div>
      </div>
      {/* se monta tras el primer toque (carga diferida de Framer Motion) */}
      {loaded && <MobileMenu open={open} onClose={() => setOpen(false)} />}
    </header>
  );
}
