import AdminShell from '../Shell';
import { CATALOG, FOUNDERS_PROMO, ONBOARDING, COMBO_MONTHLY_DISCOUNT, type Category } from '@/lib/admin/catalog';
import { clp } from '@/lib/admin/billing';

export const metadata = { title: 'Catálogo' };
const TITLES: Record<Category, string> = { combinado: 'Combinados', marketing: 'Solo marketing', software: 'Solo software' };
const money = (n: number | null, from: boolean) => (n == null ? '—' : `${from ? 'desde ' : ''}${clp(n)}`);

export default function Catalogo() {
  return (
    <AdminShell current="/admin/catalogo" title="Catálogo">
      <p className="adm-note">Solo lectura en fase 1: es exactamente lo publicado en southsoftware.cl/packs. Editar precios con historial llega en la fase 5.</p>
      <div className="adm-grid">
        <div className="adm-card"><small className="adm-note">Onboarding de marketing</small><div><b>{clp(ONBOARDING)}</b> · se cobra siempre</div></div>
        <div className="adm-card"><small className="adm-note">Combo software + marketing</small><div><b>−{COMBO_MONTHLY_DISCOUNT * 100} %</b> en la mensualidad</div></div>
        <div className="adm-card"><small className="adm-note">Clientes Fundadores</small><div><b>−{FOUNDERS_PROMO.pct * 100} %</b> solo pago inicial · hasta 30-11-2026 · {FOUNDERS_PROMO.seats} cupos</div></div>
      </div>
      {(Object.keys(TITLES) as Category[]).map((cat) => (
        <section key={cat} className="adm-section">
          <h2>{TITLES[cat]}</h2>
          <table className="adm-table cards">
            <thead><tr><th>Pack</th><th>Pago inicial</th><th>Mensual lanzamiento</th><th>Mensual</th><th>Incluye</th></tr></thead>
            <tbody>
              {CATALOG.filter((p) => p.category === cat).map((p) => (
                <tr key={p.slug} data-pack={p.slug}>
                  <td data-l="Pack"><b>{p.name}</b> {p.featured && <span className="adm-tag">Recomendado</span>}{p.tag && <div className="adm-note">{p.tag}</div>}</td>
                  <td data-l="Pago inicial" className="n">{money(p.setup, /^desde/i.test(p.raw.setup))}{p.milestones && <div className="adm-note">hitos {p.milestones.join('/')}</div>}</td>
                  <td data-l="Mensual lanzamiento" className="n">{p.launchMonthly != null ? `${money(p.launchMonthly, /^desde/i.test(p.raw.launch || ''))} × ${p.launchMonths} meses` : '—'}</td>
                  <td data-l="Mensual" className="n">{money(p.regularMonthly, /^desde/i.test(p.raw.monthly))}</td>
                  <td data-l="Incluye">{p.features.length ? p.features.length + ' ítems' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </AdminShell>
  );
}
