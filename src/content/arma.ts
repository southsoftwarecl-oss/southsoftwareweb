/**
 * "Arma tu pack": precios tomados SOLO de PACKS, CUSTOM_PACK, MARKETING_PACKS y MARKETING_ONBOARDING (site.ts).
 * Regla combo (elegida por Mathias: 15 %): si eliges al menos un servicio de software y al menos
 * un servicio mensual de marketing (plan o Meta Ads), la mensualidad total baja 15 % y el onboarding de marketing es gratis.
 * El pago inicial de software no tiene descuento. La pauta publicitaria (lo que se paga a Meta) va siempre aparte.
 */
import { CUSTOM_PACK, MARKETING_ONBOARDING, MARKETING_PACKS, PACKS } from './site';

export const COMBO_DISCOUNT = 0.15;
export const COMBO_RULE = 'Combo software + marketing: 15 % de descuento en la mensualidad total y onboarding de marketing gratis.';

const num = (v: string) => Number(v.replace(/[^\d]/g, ''));
const from = (v: string) => /^desde/i.test(v.trim());
export const clp = (n: number) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export type Item = { id: string; label: string; setup: number; monthly: number; from: boolean; group: 'software' | 'plan' | 'extra' };
const pk = (name: string) => PACKS.find((p) => p.name === name)!;
const sw = (id: string, label: string, p: { setup: string; monthly: string }): Item =>
  ({ id, label, setup: num(p.setup), monthly: num(p.monthly), from: from(p.setup) || from(p.monthly), group: 'software' });
const mk = (name: string) => MARKETING_PACKS.find((p) => p.name === name)!;

export const SOFTWARE_ITEMS: Item[] = [
  sw('landing', 'Landing', pk('Emprende')),
  sw('sitio-pyme', 'Sitio pyme', pk('Pyme')),
  sw('catalogo', 'Catálogo', pk('Automotora / Catálogo')),
  sw('ecommerce', 'E-commerce', pk('E-commerce')),
  sw('app', 'App', pk('App')),
  sw('seguridad', 'Seguridad', pk('Seguridad')),
  sw('datos', 'Datos', pk('Datos')),
  sw('a-medida', 'Software a medida', CUSTOM_PACK),
];
const plan = (id: string, label: string, name: string): Item => ({ id, label, setup: 0, monthly: num(mk(name).monthly), from: false, group: 'plan' });
export const PLAN_ITEMS: Item[] = [plan('basico', 'Marketing Básico', 'Marketing Básico'), plan('pro', 'Marketing Pro', 'Marketing Pro'), plan('full', 'Marketing Full / Captación', 'Marketing Full / Captación')];
export const EXTRA_ITEMS: Item[] = [
  { id: 'meta-ads', label: 'Meta Ads (Facebook e Instagram)', setup: 0, monthly: num(mk('Solo Ads').monthly), from: false, group: 'extra' },
  { id: 'onboarding', label: 'Onboarding de marketing', setup: num(MARKETING_ONBOARDING.price), monthly: 0, from: false, group: 'extra' },
];
export const ALL_ITEMS = [...SOFTWARE_ITEMS, ...PLAN_ITEMS, ...EXTRA_ITEMS];

export type Quote = { items: Item[]; combo: boolean; setup: number; monthly: number; monthlyBase: number; from: boolean; onboardingFree: boolean };

export function quote(ids: string[]): Quote {
  const items = ALL_ITEMS.filter((i) => ids.includes(i.id));
  const hasSw = items.some((i) => i.group === 'software');
  const hasMkt = items.some((i) => i.group === 'plan' || i.id === 'meta-ads');
  const combo = hasSw && hasMkt;
  const onboardingFree = combo && items.some((i) => i.id === 'onboarding');
  const setup = items.reduce((s, i) => s + (onboardingFree && i.id === 'onboarding' ? 0 : i.setup), 0);
  const monthlyBase = items.reduce((s, i) => s + i.monthly, 0);
  const monthly = combo ? Math.round(monthlyBase * (1 - COMBO_DISCOUNT)) : monthlyBase;
  return { items, combo, setup, monthly, monthlyBase, from: items.some((i) => i.from), onboardingFree };
}

export const fmt = (n: number, isFrom: boolean) => `${isFrom ? 'desde ' : ''}${clp(n)}`;

export function quoteMessage(q: Quote) {
  return `Hola, armé mi pack en la web: ${q.items.map((i) => i.label).join(', ')}. Pago inicial ${fmt(q.setup, q.from)} + ${fmt(q.monthly, q.from)}/mes${q.combo ? ' (con 15 % de descuento combo)' : ''}. ¿Conversamos?`;
}
