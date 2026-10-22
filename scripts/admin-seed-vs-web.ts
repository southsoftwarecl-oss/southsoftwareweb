// Genera seed_vs_web.md: catálogo del panel (derivado) vs textos literales de site.ts.
import { CATALOG } from '../src/lib/admin/catalog';
const clp = (n: number | null) => (n == null ? '—' : '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
const strip = (s?: string | null) => (s ?? '—').replace(/^desde\s*/i, '');
let out = '# Seed (panel) vs web (site.ts)\n\n| Pack | Cat. | Inicial web → panel | Lanz. web → panel | Mensual web → panel | ¿Igual? |\n|---|---|---|---|---|---|\n';
let diffs = 0;
for (const p of CATALOG) {
  const ok = strip(p.raw.setup) === clp(p.setup) && strip(p.raw.launch) === clp(p.launchMonthly) && strip(p.raw.monthly) === clp(p.regularMonthly);
  if (!ok) diffs++;
  out += `| ${p.name} | ${p.category} | ${p.raw.setup} → ${clp(p.setup)} | ${p.raw.launch ?? '—'} → ${clp(p.launchMonthly)} | ${p.raw.monthly} → ${clp(p.regularMonthly)} | ${ok ? 'Sí' : 'NO'} |\n`;
}
out += `\nDiferencias: ${diffs}. Features: se copian del mismo array de site.ts (idénticas por construcción).\n`;
process.stdout.write(out);
