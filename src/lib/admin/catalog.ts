/**
 * Catálogo del panel — packs públicos (site.ts) + montos (pack-prices.ts).
 * Nada se escribe a mano aquí: si cambia un precio en pack-prices.ts, cambia en el panel.
 */
import { COMBO_PACKS, CUSTOM_PACK, MARKETING_PACKS, PACKS } from '@/content/site';
import { COMBO_DISCOUNT } from '@/content/arma';
import { FOUNDERS_PROMO } from './founders';
import { MARKETING_ONBOARDING_PRICE, packPrice } from './pack-prices';

export type Category = 'combinado' | 'marketing' | 'software';
export type CatalogPack = {
  slug: string; name: string; category: Category; tag?: string; featured: boolean;
  /** CLP enteros. `null` = no publicado. */
  setup: number | null; launchMonthly: number | null; regularMonthly: number | null;
  launchMonths: number | null; isFrom: boolean; milestones?: number[]; features: string[];
  /** Texto literal de los montos, para comparar. */
  raw: { setup: string; monthly: string; launch?: string | null };
};

export { FOUNDERS_PROMO };

const num = (v: string) => Number(v.replace(/[^\d]/g, ''));
const isFrom = (...v: (string | null | undefined)[]) => v.some((x) => !!x && /^desde/i.test(x.trim()));
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Meses de precio de lanzamiento: la web dice "los 3 primeros meses" en condiciones. */
export const LAUNCH_MONTHS = 3;
export const ONBOARDING = num(MARKETING_ONBOARDING_PRICE);
export const COMBO_MONTHLY_DISCOUNT = COMBO_DISCOUNT;

export const CATALOG: CatalogPack[] = [
  ...COMBO_PACKS.map((p): CatalogPack => {
    const pr = packPrice(p.name);
    return {
      slug: slug(p.name), name: p.name, category: 'combinado', tag: p.tag, featured: !!p.featured,
      setup: num(pr.setup), launchMonthly: pr.launch ? num(pr.launch) : null, regularMonthly: num(pr.monthly), launchMonths: pr.launch ? LAUNCH_MONTHS : null,
      isFrom: isFrom(pr.setup, pr.monthly, pr.launch), features: p.includes, raw: { setup: pr.setup, monthly: pr.monthly, launch: pr.launch },
    };
  }),
  ...MARKETING_PACKS.map((p): CatalogPack => {
    const pr = packPrice(p.name);
    return {
      slug: slug(p.name), name: p.name, category: 'marketing', featured: !!p.featured,
      setup: num(pr.setup), launchMonthly: pr.launch ? num(pr.launch) : null, regularMonthly: num(pr.monthly), launchMonths: pr.launch ? LAUNCH_MONTHS : null,
      isFrom: isFrom(pr.setup, pr.monthly, pr.launch), features: p.includes, raw: { setup: pr.setup, monthly: pr.monthly, launch: pr.launch },
    };
  }),
  ...[...PACKS, { ...CUSTOM_PACK, includes: [] as string[] }].map((p): CatalogPack => {
    const pr = packPrice(p.name);
    return {
      slug: slug(p.name), name: p.name, category: 'software', featured: 'featured' in p && !!p.featured,
      setup: num(pr.setup), launchMonthly: null, regularMonthly: num(pr.monthly), launchMonths: null,
      isFrom: isFrom(pr.setup, pr.monthly), milestones: p.name === 'App' ? [30, 30, 30, 10] : undefined, features: p.includes, raw: { setup: pr.setup, monthly: pr.monthly },
    };
  }),
];

export const packBySlug = (s: string) => CATALOG.find((p) => p.slug === s);
