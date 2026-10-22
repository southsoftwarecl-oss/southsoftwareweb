/**
 * "Arma tu pack": precios tomados SOLO de PACKS, CUSTOM_PACK, MARKETING_PACKS y MARKETING_ONBOARDING (site.ts).
 * Regla combo (elegida por Mathias: 15 %): si eliges al menos un servicio de software y al menos
 * un servicio mensual de marketing (plan o Meta Ads), la mensualidad total baja 15 %. El onboarding de marketing se cobra siempre.
 * El pago inicial de software no tiene descuento. La pauta publicitaria (lo que se paga a Meta) va siempre aparte.
 */
import { CUSTOM_PACK, MARKETING_ONBOARDING, MARKETING_PACKS, PACKS } from './site';

export const COMBO_DISCOUNT = 0.15;
export const COMBO_RULE = 'Combo software + marketing: 15 % de descuento en la mensualidad total. El onboarding de marketing se cobra aparte.';

const num = (v: string) => Number(v.replace(/[^\d]/g, ''));
const from = (v: string) => /^desde/i.test(v.trim());
export const clp = (n: number) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export type Item = { id: string; label: string; setup: number; monthly: number; from: boolean; group: 'software' | 'plan' | 'extra'; note: string };
const pk = (name: string) => PACKS.find((p) => p.name === name)!;
const sw = (id: string, label: string, p: { setup: string; monthly: string }, note: string): Item =>
  ({ id, label, setup: num(p.setup), monthly: num(p.monthly), from: from(p.setup) || from(p.monthly), group: 'software', note });
const n0 = (name: string) => PACKS.find((p) => p.name === name)!.includes[0];
const mk = (name: string) => MARKETING_PACKS.find((p) => p.name === name)!;

export const SOFTWARE_ITEMS: Item[] = [
  sw('landing', 'Landing', pk('Emprende'), n0('Emprende')),
  sw('sitio-pyme', 'Sitio pyme', pk('Pyme'), n0('Pyme')),
  sw('catalogo', 'Catálogo', pk('Automotora / Catálogo'), n0('Automotora / Catálogo')),
  sw('ecommerce', 'E-commerce', pk('E-commerce'), n0('E-commerce')),
  sw('app', 'App', pk('App'), n0('App')),
  sw('seguridad', 'Seguridad', pk('Seguridad'), n0('Seguridad')),
  sw('datos', 'Datos', pk('Datos'), n0('Datos')),
  sw('a-medida', 'Software a medida', CUSTOM_PACK, 'Sistema interno, reservas o portal'),
];
const plan = (id: string, label: string, name: string): Item => ({ id, label, setup: 0, monthly: num(mk(name).monthly), from: false, group: 'plan', note: mk(name).includes[1] });
export const PLAN_ITEMS: Item[] = [plan('basico', 'Marketing Básico', 'Marketing Básico'), plan('pro', 'Marketing Pro', 'Marketing Pro'), plan('full', 'Marketing Full / Captación', 'Marketing Full / Captación')];
export const EXTRA_ITEMS: Item[] = [
  { id: 'meta-ads', label: 'Meta Ads (Facebook e Instagram)', setup: 0, monthly: num(mk('Solo Ads').monthly), from: false, group: 'extra', note: 'Hasta 3 campañas en Facebook e Instagram' },
  { id: 'onboarding', label: 'Onboarding de marketing', setup: num(MARKETING_ONBOARDING.price), monthly: 0, from: false, group: 'extra', note: MARKETING_ONBOARDING.includes },
];
export const ALL_ITEMS = [...SOFTWARE_ITEMS, ...PLAN_ITEMS, ...EXTRA_ITEMS];

export type Quote = { items: Item[]; combo: boolean; setup: number; monthly: number; monthlyBase: number; from: boolean };

export function quote(ids: string[]): Quote {
  const items = ALL_ITEMS.filter((i) => ids.includes(i.id));
  const hasSw = items.some((i) => i.group === 'software');
  const hasMkt = items.some((i) => i.group === 'plan' || i.id === 'meta-ads');
  const combo = hasSw && hasMkt;
  const setup = items.reduce((s, i) => s + i.setup, 0);
  const monthlyBase = items.reduce((s, i) => s + i.monthly, 0);
  const monthly = combo ? Math.round(monthlyBase * (1 - COMBO_DISCOUNT)) : monthlyBase;
  return { items, combo, setup, monthly, monthlyBase, from: items.some((i) => i.from) };
}

export const fmt = (n: number, isFrom: boolean) => `${isFrom ? 'desde ' : ''}${clp(n)}`;

export function quoteMessage(q: Quote, when = '') {
  return `Hola, armé mi pack en la web: ${q.items.map((i) => i.label).join(', ')}. Pago inicial ${fmt(q.setup, q.from)} + ${fmt(q.monthly, q.from)}/mes${q.combo ? ' (con 15 % de descuento combo)' : ''}.${when ? ` Me acomoda la reunión el ${when}.` : ''} ¿Conversamos?`;
}

export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id)!;

/** Categorías del paso 1. `step: false` = extra que se suma directo (sin paso propio). */
export type CatId = 'web' | 'app' | 'escritorio' | 'marketing' | 'seguridad' | 'datos-extra';
export const CATEGORIES: { id: CatId; label: string; note: string; title: string; hint: string; items: string[]; step: boolean }[] = [
  { id: 'web', label: 'Página web', note: 'Landing, sitio, catálogo o tienda', title: 'Tu página web', hint: 'Elige el tipo de sitio', items: ['landing', 'sitio-pyme', 'catalogo', 'ecommerce'], step: true },
  { id: 'app', label: 'App móvil', note: 'App MVP o PWA', title: 'Tu app móvil', hint: 'Elige tu app', items: ['app'], step: true },
  { id: 'escritorio', label: 'Software de escritorio', note: 'Sistemas internos y datos, precio desde', title: 'Tu software', hint: 'Elige el tipo de software', items: ['a-medida', 'datos'], step: true },
  { id: 'marketing', label: 'Marketing', note: 'Redes sociales y Meta Ads', title: 'Tu marketing', hint: '', items: ['basico', 'pro', 'full', 'meta-ads', 'onboarding'], step: true },
  { id: 'seguridad', label: 'Seguridad', note: '', title: '', hint: '', items: ['seguridad'], step: false },
  { id: 'datos-extra', label: 'Datos', note: '', title: '', hint: '', items: ['datos'], step: false },
];
export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const SLOTS = ['10:00 a 13:00', '13:00 a 16:00', '16:00 a 19:00', '19:00 a 22:00'];
