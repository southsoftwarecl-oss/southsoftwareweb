'use client';
/**
 * Shell del panel: sidebar colapsable (agrupado, badges reales), topbar con migas, buscador ⌘K, "+ Crear", menú de usuario
 * con tema, y barra inferior en móvil. Todo lo que muestra viene de props reales del servidor.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, Inbox, Users, Wallet, Package, Search, Plus, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Sun, Moon, Monitor, LogOut, Calculator, Keyboard, MoreHorizontal, FilePlus2, Banknote, type LucideIcon,
} from 'lucide-react';
import { getThemePref, setThemePref, type ThemePref } from './theme';
import { Monogram, Wordmark } from './Brand';

type NavItem = { href: string; label: string; icon: LucideIcon; group: 'General' | 'Oferta'; badge?: number; key: string };
export type ShellProps = {
  title: string; badges: { solicitudes: number }; user: { email: string | null; name: string | null; role: string };
  logout: () => Promise<void>; actions?: React.ReactNode; description?: string; children: React.ReactNode;
};

const ROLE: Record<string, string> = { owner: 'Dueño', admin: 'Administrador', ventas: 'Ventas', lectura: 'Solo lectura' };
const initials = (s: string) => s.split(/[@.\s_-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || 'SS';
const plainBtn = { border: 0, background: 'transparent', font: 'inherit', width: '100%' } as const;

export default function AppShell({ title, badges, user, logout, actions, description, children }: ShellProps) {
  const path = usePathname();
  const router = useRouter();
  const nav: NavItem[] = useMemo(() => [
    { key: 'i', href: '/admin', label: 'Inicio', icon: LayoutDashboard, group: 'General' },
    { key: 's', href: '/admin/solicitudes', label: 'Solicitudes', icon: Inbox, group: 'General', badge: badges.solicitudes },
    { key: 'c', href: '/admin/clientes', label: 'Clientes', icon: Users, group: 'General' },
    { key: 'b', href: '/admin/cobros', label: 'Cobros', icon: Wallet, group: 'General' },
    { key: 'k', href: '/admin/catalogo', label: 'Catálogo', icon: Package, group: 'Oferta' },
  ], [badges.solicitudes]);
  const canWrite = user.role !== 'lectura';
  const canPay = user.role === 'owner' || user.role === 'admin';
  const active = nav.find((n) => n.href === path) || nav.find((n) => n.href !== '/admin' && path.startsWith(n.href));
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState<null | 'user' | 'create'>(null);
  const [theme, setTheme] = useState<ThemePref>('system');
  const [mac, setMac] = useState(false);

  // Preferencias guardadas en el navegador: solo existen tras montar (evita desajuste de hidratación).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCollapsed(localStorage.getItem('ss-admin-sb') === '1');
    setTheme(getThemePref());
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  const toggleSb = useCallback(() => setCollapsed((c) => { localStorage.setItem('ss-admin-sb', c ? '0' : '1'); return !c; }), []);
  const pickTheme = useCallback((t: ThemePref) => { setTheme(t); setThemePref(t); setMenu(null); }, []);

  // Atajos: ⌘K / Ctrl K paleta, [ barra lateral, G + letra para ir a una sección. Nunca dentro de campos de texto.
  useEffect(() => {
    let g = 0;
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); return; }
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable=true]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') setMenu(null);
      if (e.key === '[') toggleSb();
      if (e.key.toLowerCase() === 'g') { g = e.timeStamp; return; }
      if (e.timeStamp - g < 1200) { const n = nav.find((x) => x.key === e.key.toLowerCase()); if (n) router.push(n.href); g = 0; }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [nav, router, toggleSb]);

  const groups = ['General', 'Oferta'] as const;
  return (
    <div className="sh" data-collapsed={collapsed ? '1' : '0'}>
      <aside className="sb" aria-label="Navegación del panel">
        <div className="sb-head">
          <Link href="/admin" className="sb-brand" aria-label="South Software · Inicio del panel">
            <Monogram size={26} className="sb-mono" /><span className="sb-title"><Wordmark height={15} title="South Software" /></span>
          </Link>
        </div>
        <nav aria-label="Panel">
          {groups.map((gname) => (
            <div key={gname}>
              <div className="sb-group">{gname}</div>
              {nav.filter((n) => n.group === gname).map((n) => (
                <Link key={n.href} href={n.href} className="sb-link a-tip" data-tip={collapsed ? n.label : undefined} aria-current={active?.href === n.href ? 'page' : undefined}>
                  <n.icon size={18} strokeWidth={1.75} aria-hidden="true" /><span>{n.label}</span>
                  {!!n.badge && <b className="sb-badge" aria-label={`${n.badge} nuevas`}>{n.badge}</b>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <button type="button" className="sb-link a-tip" onClick={toggleSb} data-tip={collapsed ? 'Expandir barra  [' : undefined} aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'} style={plainBtn}>
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} aria-hidden="true" /> : <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden="true" />}<span>Colapsar</span><kbd className="kbd" style={{ marginLeft: 'auto' }} hidden={collapsed}>[</kbd>
          </button>
          <div className="sb-user">
            <span className="a-av" aria-hidden="true">{initials(user.name || user.email || 'South Software')}</span>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email || undefined}>{user.name || user.email || 'Contraseña de respaldo'}</div><small>{ROLE[user.role] || user.role}</small></div>
          </div>
          <form action={logout}><button type="submit" className="sb-link a-tip" data-tip={collapsed ? 'Salir' : undefined} aria-label="Salir" style={plainBtn}><LogOut size={18} strokeWidth={1.75} aria-hidden="true" /><span>Salir</span></button></form>
        </div>
      </aside>

      <div className="a-main">
        <header className="tb">
          <nav className="crumbs" aria-label="Migas de pan">
            {active && active.href !== '/admin' ? <><Link href="/admin" aria-label="Volver al inicio del panel">Panel</Link><ChevronRight size={14} aria-hidden="true" /><b>{title}</b></> : <b>{title}</b>}
          </nav>
          <button type="button" className="tb-search" onClick={() => setPalette(true)} aria-label="Buscar o ir a… (atajo Ctrl K)">
            <Search size={15} aria-hidden="true" /><span>Buscar o ir a…</span><kbd>{mac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <div style={{ position: 'relative' }}>
            <button type="button" className="btn-a secondary sm" aria-haspopup="menu" aria-expanded={menu === 'create'} onClick={() => setMenu(menu === 'create' ? null : 'create')}><Plus size={15} aria-hidden="true" /> Crear</button>
            {menu === 'create' && (
              <div className="menu" role="menu" style={{ right: 0, top: 38 }}>
                {canWrite && <Link role="menuitem" href="/admin/solicitudes/nueva" onClick={() => setMenu(null)}><FilePlus2 size={15} aria-hidden="true" /> Nueva solicitud</Link>}
                {canPay && <Link role="menuitem" href="/admin/cobros/pago" onClick={() => setMenu(null)}><Banknote size={15} aria-hidden="true" /> Registrar pago</Link>}
                <Link role="menuitem" href="/admin/cobros" onClick={() => setMenu(null)}><Calculator size={15} aria-hidden="true" /> Simular calendario de cobros</Link>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button type="button" className="btn-a ghost icon sm" aria-label="Tema y cuenta" aria-haspopup="menu" aria-expanded={menu === 'user'} onClick={() => setMenu(menu === 'user' ? null : 'user')}>
              <span className="a-av" style={{ width: 26, height: 26 }} aria-hidden="true">{initials(user.name || user.email || 'South Software')}</span>
            </button>
            {menu === 'user' && (
              <div className="menu" role="menu" style={{ right: 0, top: 38 }}>
                <div className="a-lbl">Tema</div>
                {([['light', 'Claro', Sun], ['dark', 'Oscuro', Moon], ['system', 'Sistema', Monitor]] as const).map(([t, l, I]) => (
                  <button key={t} role="menuitemradio" aria-checked={theme === t} type="button" onClick={() => pickTheme(t)}><I size={15} aria-hidden="true" /> {l}</button>
                ))}
                <hr />
                <button role="menuitem" type="button" onClick={() => { setMenu(null); setPalette(true); }}><Keyboard size={15} aria-hidden="true" /> Atajos: {mac ? '⌘K' : 'Ctrl K'}, G + letra, [</button>
                <form action={logout}><button role="menuitem" type="submit"><LogOut size={15} aria-hidden="true" /> Cerrar sesión</button></form>
              </div>
            )}
          </div>
        </header>
        <main className="content" id="contenido">
          <div className="a-ph">
            <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
            {actions && <div className="ph-act">{actions}</div>}
          </div>
          {children}
        </main>
      </div>

      <nav className="bn" aria-label="Navegación móvil">
        {nav.slice(0, 4).map((n) => (
          <Link key={n.href} href={n.href} aria-current={active?.href === n.href ? 'page' : undefined}>
            <n.icon size={20} strokeWidth={1.75} aria-hidden="true" />{n.label}{!!n.badge && <b className="dot">{n.badge}</b>}
          </Link>
        ))}
        <button type="button" onClick={() => setPalette(true)} aria-label="Más secciones y búsqueda"><MoreHorizontal size={20} aria-hidden="true" />Más</button>
      </nav>

      {palette && <Palette nav={nav} theme={pickTheme} canWrite={canWrite} canPay={canPay} onClose={() => setPalette(false)} />}
      {menu && <div style={{ position: 'fixed', inset: 0, zIndex: 15 }} onClick={() => setMenu(null)} aria-hidden="true" />}
    </div>
  );
}

function Palette({ nav, theme, onClose, canWrite, canPay }: { nav: NavItem[]; theme: (t: ThemePref) => void; onClose: () => void; canWrite: boolean; canPay: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo(() => {
    const all = [
      ...nav.map((n) => ({ group: 'Ir a', label: n.label, icon: n.icon, hint: `G ${n.key.toUpperCase()}`, run: () => router.push(n.href) })),
      ...(canWrite ? [{ group: 'Acciones', label: 'Nueva solicitud', icon: FilePlus2, hint: '', run: () => router.push('/admin/solicitudes/nueva') }] : []),
      ...(canPay ? [{ group: 'Acciones', label: 'Registrar pago', icon: Banknote, hint: '', run: () => router.push('/admin/cobros/pago') }] : []),
      { group: 'Acciones', label: 'Simular calendario de cobros', icon: Calculator, hint: '', run: () => router.push('/admin/cobros') },
      { group: 'Acciones', label: 'Tema claro', icon: Sun, hint: '', run: () => theme('light') },
      { group: 'Acciones', label: 'Tema oscuro', icon: Moon, hint: '', run: () => theme('dark') },
      { group: 'Acciones', label: 'Tema del sistema', icon: Monitor, hint: '', run: () => theme('system') },
    ];
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = norm(q.trim());
    return n ? all.filter((i) => norm(i.label).includes(n)) : all;
  }, [q, nav, router, theme, canWrite, canPay]);
  useEffect(() => { const prev = document.activeElement as HTMLElement | null; input.current?.focus(); return () => prev?.focus?.(); }, []);
  const run = (i: number) => { const it = items[i]; if (it) { onClose(); it.run(); } };
  return (
    <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Buscar o ir a">
        <div className="cmdk-in">
          <Search size={17} aria-hidden="true" style={{ color: 'var(--text-tertiary)' }} />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Buscar sección o acción…" aria-label="Buscar sección o acción" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={items[sel] ? `cmdk-${sel}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
              else if (e.key === 'Escape') onClose();
            }} />
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk-list" id="cmdk-list" role="listbox">
          {items.length === 0 && <div className="cmdk-empty">Sin resultados para “{q}”.</div>}
          {items.map((it, i) => (
            <div key={it.label}>
              {(i === 0 || items[i - 1].group !== it.group) && <div className="cmdk-g">{it.group}</div>}
              <div id={`cmdk-${i}`} role="option" aria-selected={i === sel} className="cmdk-it" onMouseMove={() => setSel(i)} onClick={() => run(i)}>
                <it.icon size={16} aria-hidden="true" />{it.label}{it.hint && <kbd>{it.hint}</kbd>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
