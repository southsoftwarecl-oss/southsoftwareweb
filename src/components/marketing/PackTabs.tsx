'use client';
/** Pestañas Combinados / Marketing / Software. Sin JS se ven los tres grupos; con JS uno a la vez (y #hash abre la pestaña). */
import { useEffect, useState, type ReactNode } from 'react';

export default function PackTabs({ tabs, children }: { tabs: { id: string; label: string }[]; children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => { const h = location.hash.slice(1); setActive(tabs.some((t) => t.id === h) ? h : (a) => a ?? tabs[0].id); };
    sync();
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, [tabs]);
  useEffect(() => {
    if (!active) return;
    tabs.forEach((t) => { const el = document.getElementById(t.id); if (el) el.hidden = t.id !== active; });
  }, [active, tabs]);
  return (
    <div className="pk-tabs-w" id="packs-grupos">
      <div className="wrap"><div className="pk-tabs" role="tablist" aria-label="Grupos de packs">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={active ? active === t.id : t.id === tabs[0].id} aria-controls={t.id}
            className="pk-tab" onClick={() => setActive(t.id)}>{t.label}</button>
        ))}
      </div></div>
      {children}
    </div>
  );
}
