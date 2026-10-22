/**
 * Catálogo del panel — derivado 1:1 de src/content/site.ts (única fuente de verdad hoy). Nada se escribe a mano aquí:
 * si cambia un precio en site.ts, cambia en el panel. En fase 5 esto se invierte (BD → web).
 */
import { COMBO_PACKS, CUSTOM_PACK, FOUNDERS, MARKETING_ONBOARDING, MARKETING_PACKS, PACKS } from '@/content/site';
import { COMBO_DISCOUNT } from '@/content/arma';

export type Category = 'combinado' | 'marketing' | 'software';
export type CatalogPack = {
  slug: string; name: string; category: Category; tag?: string; featured: boolean;
  /** CLP enteros. `null` = no publicado. */
  setup: number | null; launchMonthly: number | null; regularMonthly: number | null;
  launchMonths: number | null; isFrom: boolean; milestones?: number[]; features: string[];
  /** Texto literal de la web, para comparar. */
  raw: { setup: string; monthly: string; launch?: string | null };
};

const num = (v: string) => Number(v.replace(/[^\d]/g, ''));
const isFrom = (...v: (string | null | undefined)[]) => v.some((x) => !!x && /^desde/i.test(x.trim()));
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Meses de precio de lanzamiento: la web dice "los 3 primeros meses" en condiciones. */
export const LAUNCH_MONTHS = 3;
export const ONBOARDING = num(MARKETING_ONBOARDING.price);
export const COMBO_MONTHLY_DISCOUNT = COMBO_DISCOUNT;
/** Fundadores: 30 % solo en el pago inicial, hasta el 30-11-2026 (texto en site.ts FOUNDERS). 10 cupos. */
export const FOUNDERS_PROMO = { pct: 0.3, until: '2026-11-30', seats: 10, text: FOUNDERS.text };

export const CATALOG: CatalogPack[] = [
  ...COMBO_PACKS.map((p): CatalogPack => ({
    slug: slug(p.name), name: p.name, category: 'combinado', tag: p.tag, featured: !!p.featured,
    setup: num(p.setup), launchMonthly: p.launch ? num(p.launch) : null, regularMonthly: num(p.monthly), launchMonths: p.launch ? LAUNCH_MONTHS : null,
    isFrom: isFrom(p.setup, p.monthly, p.launch), features: p.includes, raw: { setup: p.setup, monthly: p.monthly, launch: p.launch },
  })),
  ...MARKETING_PACKS.map((p): CatalogPack => ({
    slug: slug(p.name), name: p.name, category: 'marketing', featured: !!p.featured,
    // setup de marketing = onboarding único ($99.990), siempre cobrado
    setup: num(p.setup), launchMonthly: p.launch ? num(p.launch) : null, regularMonthly: num(p.monthly), launchMonths: p.launch ? LAUNCH_MONTHS : null,
    isFrom: isFrom(p.setup, p.monthly, p.launch), features: p.includes, raw: { setup: p.setup, monthly: p.monthly, launch: p.launch },
  })),
  ...[...PACKS, { ...CUSTOM_PACK, includes: [] as string[] }].map((p): CatalogPack => ({
    slug: slug(p.name), name: p.name, category: 'software', featured: 'featured' in p && !!p.featured,
    setup: num(p.setup), launchMonthly: null, regularMonthly: num(p.monthly), launchMonths: null,
    isFrom: isFrom(p.setup, p.monthly), milestones: p.name === 'App' ? [30, 30, 30, 10] : undefined, features: p.includes, raw: { setup: p.setup, monthly: p.monthly },
  })),
];

export const packBySlug = (s: string) => CATALOG.find((p) => p.slug === s);
