/**
 * Calendario de cobros (cálculo puro, sin BD). Supuestos marcados SUPUESTO deben confirmarse con Mathias
 * (ver docs/admin/PREGUNTAS.md) antes de usarse con clientes reales.
 */
import { FOUNDERS_PROMO, type CatalogPack } from './catalog';

export type Charge = { date: string | null; concept: string; amount: number; kind: 'inicial' | 'mensual' | 'hito' };

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
/** Suma meses manteniendo el día; si el mes no lo tiene, usa el último día (31-01 + 1 mes = 28/29-02). */
export function addMonths(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m - 1 + months, Math.min(d, last))));
}
export const clp = (n: number) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const fmtDate = (isoDate: string) => isoDate.split('-').reverse().join('-');

/** Fundadores: aplica si la fecha de contratación es ≤ 30-11-2026. Solo descuenta el pago inicial. */
export const foundersApplies = (signedOn: string) => signedOn <= FOUNDERS_PROMO.until;

export function schedule(pack: CatalogPack, start: string, opts: { months?: number; founders?: boolean } = {}): Charge[] {
  const months = opts.months ?? 6;
  const out: Charge[] = [];
  const setup = pack.setup ?? 0;
  const discount = opts.founders && foundersApplies(start) ? Math.round(setup * FOUNDERS_PROMO.pct) : 0;
  if (pack.milestones) {
    pack.milestones.forEach((pct, i) => out.push({ date: null, concept: `Hito ${i + 1} (${pct} % del pago inicial)`, amount: Math.round(((setup - discount) * pct) / 100), kind: 'hito' }));
  } else if (setup) {
    out.push({ date: start, concept: discount ? `Pago inicial (Fundadores −30 %: ${clp(setup)} → ${clp(setup - discount)})` : pack.category === 'marketing' ? 'Onboarding de marketing' : 'Pago inicial', amount: setup - discount, kind: 'inicial' });
  }
  // SUPUESTO: la 1.ª mensualidad se cobra 1 mes después del alta, mismo día.
  for (let i = 1; i <= months; i++) {
    const launch = pack.launchMonthly != null && pack.launchMonths != null && i <= pack.launchMonths;
    const amount = launch ? pack.launchMonthly! : pack.regularMonthly;
    if (amount == null) continue;
    out.push({ date: addMonths(start, i), concept: `Mensualidad ${i}${launch ? ' (precio de lanzamiento)' : ''}`, amount, kind: 'mensual' });
  }
  return out;
}

/** Estado de un cobro según hoy (America/Santiago se resuelve al formatear "hoy" fuera de aquí). */
export function chargeStatus(due: string, today: string, paid = false): 'pagado' | 'vencido' | 'por_vencer' | 'programado' {
  if (paid) return 'pagado';
  if (due < today) return 'vencido';
  return due <= addDays(today, 7) ? 'por_vencer' : 'programado';
}
export function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return iso(new Date(Date.UTC(y, m - 1, d + days)));
}
