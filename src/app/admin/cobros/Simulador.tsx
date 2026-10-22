'use client';
import { useState } from 'react';
import { CATALOG } from '@/lib/admin/catalog';
import { clp, fmtDate, schedule } from '@/lib/admin/billing';

export default function Simulador({ today }: { today: string }) {
  const [slug, setSlug] = useState('vitrina-digital');
  const [start, setStart] = useState(today);
  const [founders, setFounders] = useState(false);
  const [launch, setLaunch] = useState('');
  const [day, setDay] = useState('');
  const pack = CATALOG.find((p) => p.slug === slug)!;
  const rows = start ? schedule(pack, start, { founders, months: 6, launch: launch || start, billingDay: day ? Number(day) : null }) : [];
  return (
    <div>
      <div className="adm-form">
        <div className="adm-field"><label htmlFor="sim-pack">Pack</label>
          <select id="sim-pack" value={slug} onChange={(e) => setSlug(e.target.value)}>{CATALOG.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></div>
        <div className="adm-field"><label htmlFor="sim-start">Fecha de alta</label><input id="sim-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="adm-field"><label htmlFor="sim-launch">Fecha de lanzamiento</label><input id="sim-launch" type="date" value={launch} onChange={(e) => setLaunch(e.target.value)} /></div>
        <div className="adm-field"><label htmlFor="sim-day">Día de cobro</label>
          <select id="sim-day" value={day} onChange={(e) => setDay(e.target.value)}><option value="">Mismo día del lanzamiento</option>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 10 }}><input type="checkbox" checked={founders} onChange={(e) => setFounders(e.target.checked)} /> Cliente Fundador</label>
      </div>
      {pack.isFrom && <p className="adm-note">Este pack tiene precio “desde”: el monto final sale de la cotización.</p>}
      <table className="adm-table cards" data-testid="sim-table">
        <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td data-l="Fecha">{r.date ? fmtDate(r.date) : 'Según avance'}</td><td data-l="Concepto">{r.concept}</td><td data-l="Monto" className="n">{clp(r.amount)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
