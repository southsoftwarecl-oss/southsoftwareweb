/**
 * Niveles de calidad del hero 3D.
 *  high   14k gotas + pasada de fluido (desktop por defecto)
 *  mid    14k sin fluido (PerformanceMonitor degrada desde high, o desktop modesto)
 *  mobile 7k, DPR ≤ 1.5, sin fluido, matcap en vez de PMREM
 *  low    4k, DPR 1, matcap
 * Al degradar (onDecline): 1) se apaga el fluido, 2) baja el DPR, 3) se reducen partículas.
 */
export type Tier = 'high' | 'mid' | 'mobile' | 'low';
export type TierCfg = { tex: number; count: number; liquid: boolean; matcap: boolean; dpr: number };

export const TIERS: Record<Tier, TierCfg> = {
  high: { tex: 128, count: 14000, liquid: true, matcap: false, dpr: 1.75 },
  mid: { tex: 128, count: 14000, liquid: false, matcap: false, dpr: 1.75 },
  mobile: { tex: 96, count: 7000, liquid: false, matcap: true, dpr: 1.5 },
  low: { tex: 64, count: 4000, liquid: false, matcap: true, dpr: 1 },
};

/** Configuración efectiva según el nivel inicial y cuántas degradaciones van (0–3). */
export function effectiveCfg(tier: Tier, level: number): TierCfg {
  const base = { ...TIERS[tier] };
  if (level >= 1) base.liquid = false;
  if (level >= 2) base.dpr = 1;
  if (level >= 3 && base.tex > 64) { const next = base.tex === 128 ? TIERS.mobile : TIERS.low; base.tex = next.tex; base.count = next.count; }
  return base;
}

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
/** Nivel inicial a partir de las capacidades del dispositivo. */
export function detectTier(): Tier {
  const forced = forcedTier(); if (forced) return forced;
  const n = navigator as Nav;
  const cores = n.hardwareConcurrency || 8, mem = n.deviceMemory || 8;
  if (cores <= 2 || mem <= 2 || n.connection?.saveData) return 'low';
  if (innerWidth < 760 || matchMedia('(hover:none)').matches) return 'mobile';
  if (cores <= 4 || mem <= 4) return 'mid';
  return 'high';
}

/** QA: `?gl=high|mid|mobile|low` fuerza un nivel y desactiva la degradación automática. */
export function forcedTier(): Tier | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search).get('gl');
  return q && q in TIERS ? (q as Tier) : null;
}
