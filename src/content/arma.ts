/**
 * "Arma tu pack" (cliente): ítems, categorías y mensaje de WhatsApp, SIN montos.
 * La cotización con precios vive en lib/admin/arma-quote.ts (solo servidor/admin).
 * Regla combo (15 %): software + marketing mensual. El onboarding se cobra siempre.
 */
import { MARKETING_ONBOARDING, MARKETING_PACKS, PACKS } from './site';

export const COMBO_DISCOUNT = 0.15;
export const COMBO_RULE = 'Combo software + marketing: 15 % de descuento en la mensualidad total. El onboarding de marketing se cobra aparte.';

export type Item = { id: string; label: string; group: 'software' | 'plan' | 'extra'; note: string };
const n0 = (name: string) => PACKS.find((p) => p.name === name)!.includes[0];
const mk = (name: string) => MARKETING_PACKS.find((p) => p.name === name)!;

export const SOFTWARE_ITEMS: Item[] = [
  { id: 'landing', label: 'Landing', group: 'software', note: n0('Emprende') },
  { id: 'sitio-pyme', label: 'Sitio pyme', group: 'software', note: n0('Pyme') },
  { id: 'catalogo', label: 'Vitrina Digital', group: 'software', note: 'Catálogo autoadministrable con filtros y cotización por WhatsApp' },
  { id: 'ecommerce', label: 'E-commerce', group: 'software', note: n0('E-commerce') },
  { id: 'app', label: 'App', group: 'software', note: n0('App') },
  { id: 'seguridad', label: 'Seguridad', group: 'software', note: 'Blindaje Digital: web y correo protegidos, con monitoreo' },
  { id: 'datos', label: 'Datos', group: 'software', note: n0('Datos') },
  { id: 'a-medida', label: 'Software a medida', group: 'software', note: 'Sistema interno, reservas o portal' },
];
const plan = (id: string, label: string, name: string): Item => ({ id, label, group: 'plan', note: mk(name).includes[1] });
export const PLAN_ITEMS: Item[] = [plan('basico', 'Marketing Básico', 'Marketing Básico'), plan('pro', 'Marketing Pro', 'Marketing Pro'), plan('full', 'Marketing Full / Captación', 'Marketing Full / Captación')];
export const EXTRA_ITEMS: Item[] = [
  { id: 'meta-ads', label: 'Meta Ads (Facebook e Instagram)', group: 'extra', note: 'Hasta 3 campañas en Facebook e Instagram' },
  { id: 'onboarding', label: 'Onboarding de marketing', group: 'extra', note: MARKETING_ONBOARDING.includes },
];
export const ALL_ITEMS = [...SOFTWARE_ITEMS, ...PLAN_ITEMS, ...EXTRA_ITEMS];

export type Selection = { items: Item[]; combo: boolean };

export function selection(ids: string[]): Selection {
  const items = ALL_ITEMS.filter((i) => ids.includes(i.id));
  const hasSw = items.some((i) => i.group === 'software');
  const hasMkt = items.some((i) => i.group === 'plan' || i.id === 'meta-ads');
  return { items, combo: hasSw && hasMkt };
}

export function quoteMessage(q: { items: { label: string }[]; combo: boolean }, when = '') {
  return `Hola, armé mi pack en la web: ${q.items.map((i) => i.label).join(', ')}.${q.combo ? ' Aplica descuento combo 15 %.' : ''}${when ? ` Me acomoda la reunión el ${when}.` : ''} ¿Conversamos?`;
}

export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id)!;

/** Categorías del paso 1. `step: false` = extra que se suma directo (sin paso propio). */
export type CatId = 'web' | 'app' | 'escritorio' | 'marketing' | 'seguridad' | 'datos-extra';
export const CATEGORIES: { id: CatId; label: string; note: string; title: string; hint: string; items: string[]; step: boolean }[] = [
  { id: 'web', label: 'Página web', note: 'Landing, sitio, vitrina o tienda', title: 'Tu página web', hint: 'Elige el tipo de sitio', items: ['landing', 'sitio-pyme', 'catalogo', 'ecommerce'], step: true },
  { id: 'app', label: 'App móvil', note: 'App MVP o PWA', title: 'Tu app móvil', hint: 'Elige tu app', items: ['app'], step: true },
  { id: 'escritorio', label: 'Software de escritorio', note: 'Sistemas internos y datos', title: 'Tu software', hint: 'Elige el tipo de software', items: ['a-medida', 'datos'], step: true },
  { id: 'marketing', label: 'Marketing', note: 'Redes sociales y Meta Ads', title: 'Tu marketing', hint: '', items: ['basico', 'pro', 'full', 'meta-ads', 'onboarding'], step: true },
  { id: 'seguridad', label: 'Seguridad', note: '', title: '', hint: '', items: ['seguridad'], step: false },
  { id: 'datos-extra', label: 'Datos', note: '', title: '', hint: '', items: ['datos'], step: false },
];
export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const SLOTS = ['10:00 a 13:00', '13:00 a 16:00', '16:00 a 19:00', '19:00 a 22:00'];
