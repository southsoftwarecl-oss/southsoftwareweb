/**
 * Calendario de cobros (cálculo puro, sin BD). Reglas confirmadas por Mathias (22‑10‑2026): mensualidades desde el
 * lanzamiento + 1 mes, en el día de cobro elegido por el cliente (1–28; por defecto el día del lanzamiento).
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

/** Día de cobro efectivo: el elegido por el cliente (1–28) o, si no hay, el día de lanzamiento (tope 28). */
export function effectiveBillingDay(launch: string, billingDay?: number | null) {
  if (billingDay != null) {
    if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) throw new Error('billing_day debe estar entre 1 y 28');
    return billingDay;
  }
  return Math.min(Number(launch.slice(8, 10)), 28);
}
/** 1.ª mensualidad: el primer día de cobro que cae en o después de lanzamiento + 1 mes (decisión de Mathias, 22‑10‑2026). */
export function firstMonthlyDate(launch: string, billingDay?: number | null) {
  const day = effectiveBillingDay(launch, billingDay);
  const min = addMonths(launch, 1);
  const cand = `${min.slice(0, 8)}${String(day).padStart(2, '0')}`;
  return cand >= min ? cand : `${addMonths(cand, 1)}`;
}

export function schedule(pack: CatalogPack, start: string, opts: { months?: number; founders?: boolean; launch?: string; billingDay?: number | null } = {}): Charge[] {
  const months = opts.months ?? 6;
  const out: Charge[] = [];
  const setup = pack.setup ?? 0;
  const discount = opts.founders && foundersApplies(start) ? Math.round(setup * FOUNDERS_PROMO.pct) : 0;
  if (pack.milestones) {
    pack.milestones.forEach((pct, i) => out.push({ date: null, concept: `Hito ${i + 1} (${pct} % del pago inicial)`, amount: Math.round(((setup - discount) * pct) / 100), kind: 'hito' }));
  } else if (setup) {
    out.push({ date: start, concept: discount ? `Pago inicial (Fundadores −30 %: ${clp(setup)} → ${clp(setup - discount)})` : pack.category === 'marketing' ? 'Onboarding de marketing' : 'Pago inicial', amount: setup - discount, kind: 'inicial' });
  }
  // 1.ª mensualidad: primer día de cobro ≥ lanzamiento + 1 mes; luego mensual ese mismo día.
  const first = firstMonthlyDate(opts.launch || start, opts.billingDay);
  for (let i = 1; i <= months; i++) {
    const launch = pack.launchMonthly != null && pack.launchMonths != null && i <= pack.launchMonths;
    const amount = launch ? pack.launchMonthly! : pack.regularMonthly;
    if (amount == null) continue;
    out.push({ date: addMonths(first, i - 1), concept: `Mensualidad ${i}${launch ? ' (precio de lanzamiento)' : ''}`, amount, kind: 'mensual' });
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
