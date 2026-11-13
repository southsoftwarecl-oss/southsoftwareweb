/**
 * Cotización con montos: solo servidor / admin. El cliente usa content/arma.ts (sin precios).
 */
import { ALL_ITEMS, COMBO_DISCOUNT, type Item } from '@/content/arma';
import { MARKETING_ONBOARDING_PRICE, packPrice } from './pack-prices';

const num = (v: string) => Number(v.replace(/[^\d]/g, ''));
const isFrom = (v: string) => /^desde/i.test(v.trim());
export const clp = (n: number) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Ítem de Arma tu pack → nombre en PACK_PRICES. El onboarding se resuelve aparte. */
const ID_TO_PACK: Record<string, string> = {
  landing: 'Emprende',
  'sitio-pyme': 'Pyme',
  catalogo: 'Vitrina Digital',
  ecommerce: 'E-commerce',
  app: 'App',
  seguridad: 'Blindaje Digital',
  datos: 'Datos',
  'a-medida': 'Software a medida',
  basico: 'Marketing Básico',
  pro: 'Marketing Pro',
  full: 'Marketing Full / Captación',
  'meta-ads': 'Solo Ads',
};

const PLAN_OR_ADS = new Set(['basico', 'pro', 'full', 'meta-ads']);

export type PricedItem = Item & { setup: number; monthly: number; from: boolean };
export type Quote = { items: PricedItem[]; combo: boolean; setup: number; monthly: number; monthlyBase: number; from: boolean };

function amounts(id: string): { setup: number; monthly: number; from: boolean } {
  if (id === 'onboarding') return { setup: num(MARKETING_ONBOARDING_PRICE), monthly: 0, from: false };
  const p = packPrice(ID_TO_PACK[id]);
  if (PLAN_OR_ADS.has(id)) return { setup: 0, monthly: num(p.monthly), from: isFrom(p.monthly) };
  return { setup: num(p.setup), monthly: num(p.monthly), from: isFrom(p.setup) || isFrom(p.monthly) };
}

export function quote(ids: string[]): Quote {
  const items: PricedItem[] = ALL_ITEMS.filter((i) => ids.includes(i.id)).map((i) => ({ ...i, ...amounts(i.id) }));
  const hasSw = items.some((i) => i.group === 'software');
  const hasMkt = items.some((i) => i.group === 'plan' || i.id === 'meta-ads');
  const combo = hasSw && hasMkt;
  const setup = items.reduce((s, i) => s + i.setup, 0);
  const monthlyBase = items.reduce((s, i) => s + i.monthly, 0);
  const monthly = combo ? Math.round(monthlyBase * (1 - COMBO_DISCOUNT)) : monthlyBase;
  return { items, combo, setup, monthly, monthlyBase, from: items.some((i) => i.from) };
}

export const fmt = (n: number, from: boolean) => `${from ? 'desde ' : ''}${clp(n)}`;
