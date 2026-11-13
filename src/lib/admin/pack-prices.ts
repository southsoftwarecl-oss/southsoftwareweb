/**
 * Precios de packs (CLP, valores brutos). SOLO para servidor y panel admin.
 * No importar desde componentes cliente públicos: deben quedar fuera del bundle.
 */
export type PackPrice = { setup: string; monthly: string; launch?: string | null };

/** Montos por nombre de pack (software, combinados, marketing y software a medida). */
export const PACK_PRICES: Record<string, PackPrice> = {
  Emprende: { setup: '$149.990', monthly: '$19.990' },
  Pyme: { setup: '$349.990', monthly: '$34.990' },
  'Vitrina Digital': { setup: '$549.990', monthly: '$49.990' },
  'E-commerce': { setup: '$699.990', monthly: '$59.990' },
  App: { setup: 'desde $1.490.000', monthly: 'desde $99.990' },
  'Blindaje Digital': { setup: '$249.990', monthly: '$29.990' },
  Datos: { setup: 'desde $390.000', monthly: 'desde $39.990' },
  'Software a medida': { setup: 'desde $1.900.000', monthly: 'desde $79.990' },
  Despega: { setup: '$149.990', monthly: '$189.990', launch: '$169.990' },
  Crece: { setup: '$349.990', monthly: '$329.990', launch: '$299.990' },
  'Vitrina + Leads': { setup: '$549.990', monthly: '$269.990', launch: '$239.990' },
  Vende: { setup: '$699.990', monthly: '$479.990', launch: '$429.990' },
  Total: { setup: 'desde $1.790.000', monthly: 'desde $599.990', launch: 'desde $549.990' },
  'Marketing Básico': { setup: '$99.990', monthly: '$189.990', launch: '$149.990' },
  'Marketing Pro': { setup: '$99.990', monthly: '$349.990', launch: '$299.990' },
  'Marketing Full / Captación': { setup: '$99.990', monthly: '$549.990', launch: '$489.990' },
  'Solo Ads': { setup: '$99.990', monthly: '$149.990', launch: null },
};

/** Onboarding único de los planes solo marketing (también se cobra en los combinados). */
export const MARKETING_ONBOARDING_PRICE = '$99.990';

export function packPrice(name: string): PackPrice {
  const p = PACK_PRICES[name];
  if (!p) throw new Error(`Falta el precio del pack "${name}"`);
  return p;
}
