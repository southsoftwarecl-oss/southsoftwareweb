/**
 * POST /api/leads — registra la intención de un CTA (antes de abrir WhatsApp). Lo envía el navegador con sendBeacon; nunca bloquea el WhatsApp.
 * Mismo origen, máx 4 KB, rate limit en memoria, zod. Montos recalculados en servidor (no se confía en el cliente). IP solo como hash.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { leadSchema } from '@/lib/lead-schema';
import { hashIp, saveLead } from '@/lib/admin/leads';
import { quote, ALL_ITEMS } from '@/content/arma';
import { packBySlug, CATALOG } from '@/lib/admin/catalog';

const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now(), max = Number(process.env.LEADS_RATE_LIMIT) || 20;
  const l = (hits.get(ip) || []).filter((t) => now - t < 600_000); l.push(now); hits.set(ip, l);
  if (hits.size > 5000) hits.clear();
  return l.length > max;
};
const res = (status: number) => new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try { if (!origin || new URL(origin).host !== host) return res(403); } catch { return res(403); }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res(429);
  const raw = await req.text();
  if (raw.length > 4096) return res(413);
  let body: unknown; try { body = JSON.parse(raw); } catch { return res(400); }
  const p = leadSchema.safeParse(body);
  if (!p.success) return res(422);
  const d = p.data;

  let setup: number | null = null, monthly: number | null = null, pack: string | null = null, builder: Record<string, unknown> | null = null;
  if (d.channel === 'arma_tu_pack') {
    const ids = (d.items || []).filter((i) => ALL_ITEMS.some((x) => x.id === i));
    if (!ids.length) return res(422);
    const q = quote(ids);
    setup = q.setup; monthly = q.monthly;
    builder = { items: ids, labels: q.items.map((i) => i.label), combo: q.combo, monthlyBase: q.monthlyBase, from: q.from, when: d.when || null, priceSource: 'site.ts' };
  } else if (d.channel === 'elegir_pack') {
    const c = CATALOG.find((x) => x.name === d.pack) || (d.pack ? packBySlug(d.pack) : undefined);
    if (!c) return res(422);
    pack = c.name; setup = c.setup; monthly = c.launchMonthly ?? c.regularMonthly;
  }
  const ok = await saveLead({
    channel: d.channel, payload: d, pack, builder, setup, monthly,
    referrer: d.path || null, ipHash: await hashIp(ip), userAgent: req.headers.get('user-agent'),
  });
  return res(ok ? 204 : 503);
}
