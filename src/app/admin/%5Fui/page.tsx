/** /admin/_ui — vitrina de componentes del panel (protegida igual que el resto). Solo ejemplos visuales, sin datos reales. */
import AdminShell, { Empty } from '../Shell';
import { IllCalendar, IllCheck, IllInbox, IllPeople, IllTag } from '@/components/admin/Illustrations';
import { Plus, Download, Trash2 } from 'lucide-react';

export const metadata = { title: 'Componentes' };

const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="adm-section"><h2>{t}</h2><div className="adm-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div></section>
);

export default function UiShowcase() {
  return (
    <AdminShell title="Componentes" description="Vitrina interna del sistema de diseño. Los valores son ilustrativos.">
      <span className="chip warn">Datos de ejemplo</span>
      <Sec t="Botones">
        <button className="btn-a primary" type="button"><Plus size={15} aria-hidden="true" /> Primario</button>
        <button className="btn-a secondary" type="button"><Download size={15} aria-hidden="true" /> Secundario</button>
        <button className="btn-a ghost" type="button">Fantasma</button>
        <button className="btn-a subtle" type="button">Sutil</button>
        <button className="btn-a danger" type="button"><Trash2 size={15} aria-hidden="true" /> Peligro</button>
        <button className="btn-a primary sm" type="button">Pequeño</button>
        <button className="btn-a primary lg" type="button">Grande</button>
        <button className="btn-a primary" type="button" disabled>Deshabilitado</button>
      </Sec>
      <Sec t="Chips de estado">
        <span className="chip ok">Al día</span><span className="chip warn">Vence en 3 días</span><span className="chip bad">Vencido</span><span className="chip neutral">Pausado</span><span className="adm-tag">Etiqueta</span>
      </Sec>
      <Sec t="Campos">
        <div className="adm-field" style={{ minWidth: 240 }}><label htmlFor="u1">Texto</label><input id="u1" placeholder="Escribe aquí" /></div>
        <div className="adm-field" style={{ minWidth: 200 }}><label htmlFor="u2">Selección</label><select id="u2"><option>Boleta</option><option>Factura</option></select></div>
        <div className="adm-field" style={{ minWidth: 200 }}><label htmlFor="u3">Con error</label><input id="u3" aria-invalid="true" defaultValue="12.345.678" /><span className="adm-err" style={{ margin: 0 }}>RUT no válido</span></div>
      </Sec>
      <Sec t="KPI">
        <div className="adm-card kpi" style={{ minWidth: 200 }}><div className="kpi-l">Ejemplo con valor</div><div className="kpi-v">$ 1.234.000</div><div className="adm-note">dato de ejemplo</div></div>
        <div className="adm-card kpi" style={{ minWidth: 200 }}><div className="kpi-l">Sin datos</div><div className="kpi-v empty">Aún no hay datos</div><div className="kpi-flat" /></div>
      </Sec>
      <section className="adm-section"><h2>Tabla</h2>
        <table className="adm-table cards"><thead><tr><th>Cliente</th><th>Pack</th><th className="n">Monto</th><th>Estado</th></tr></thead>
          <tbody>
            <tr><td data-l="Cliente">Cliente de ejemplo A</td><td data-l="Pack">Web</td><td data-l="Monto" className="n">$ 45.000</td><td data-l="Estado"><span className="chip ok">Al día</span></td></tr>
            <tr><td data-l="Cliente">Cliente de ejemplo B</td><td data-l="Pack">App</td><td data-l="Monto" className="n">$ 120.000</td><td data-l="Estado"><span className="chip bad">Vencido</span></td></tr>
          </tbody></table>
      </section>
      <section className="adm-section"><h2>Estados vacíos</h2>
        <div className="adm-grid">
          <Empty ill={<IllInbox />} title="Bandeja vacía">Texto explicativo.</Empty>
          <Empty ill={<IllCalendar />} title="Sin cobros" actions={<button className="btn-a secondary sm" type="button">Acción</button>} />
          <Empty ill={<IllPeople />} title="Sin clientes" /><Empty ill={<IllTag />} title="Sin packs" /><Empty ill={<IllCheck />} title="Todo al día" />
        </div>
      </section>
    </AdminShell>
  );
}
