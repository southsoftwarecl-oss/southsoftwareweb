/** Datos del Inicio. Todo sale de datos reales (solicitudes, cobros, clientes); si algo no existe, se devuelve null y la UI lo dice. */
import { leadsBackend, listLeads, nowMs, type Lead } from './leads';
import { listOpenCharges, type OpenCharge } from './charges';
import { supabaseUser } from '@/lib/supabase/server';
import { PROPOSAL_STALE_DAYS } from './model';

const DAY = 86_400_000;
const ymdCL = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date(ms));

export type HomeData = {
  now: number; today: string; hour: number; longDate: string;
  leads: Lead[]; leadsError?: string;
  week: number; prevWeek: number; spark: number[] | null; newCount: number; stale: Lead[]; staleProposals: Lead[]; meetingsToday: Lead[];
  charges: OpenCharge[]; dueToday: OpenCharge[]; overdue: OpenCharge[]; monthDue: number | null; overdueSum: number | null;
  foundersUsed: number | null; clients: number | null; payments: number | null;
};

async function counts(): Promise<{ founders: number | null; clients: number | null; payments: number | null }> {
  const be = leadsBackend();
  if (be === 'memory') {
    const g = globalThis as unknown as { __ssCharges?: { payments: unknown[] } };
    return { founders: 0, clients: 0, payments: g.__ssCharges?.payments.length ?? 0 };
  }
  if (be === 'off') return { founders: null, clients: null, payments: null };
  const sb = await supabaseUser();
  const [f, c, p] = await Promise.all([
    sb.from('clients').select('id', { count: 'exact', head: true }).eq('is_founder', true).is('deleted_at', null),
    sb.from('clients').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    sb.from('payments').select('id', { count: 'exact', head: true }),
  ]);
  return { founders: f.error ? null : f.count ?? 0, clients: c.error ? null : c.count ?? 0, payments: p.error ? null : p.count ?? 0 };
}

export async function homeData(): Promise<HomeData> {
  const now = nowMs();
  const [{ leads, error }, { charges }, k] = await Promise.all([listLeads(), listOpenCharges(), counts()]);
  const t = (l: Lead) => new Date(l.createdAt).getTime();
  const week = leads.filter((l) => now - t(l) < 7 * DAY).length;
  const prevWeek = leads.filter((l) => now - t(l) >= 7 * DAY && now - t(l) < 14 * DAY).length;
  const last30 = leads.filter((l) => now - t(l) < 30 * DAY);
  const spark = last30.length ? Array.from({ length: 30 }, (_, i) => last30.filter((l) => Math.floor((now - t(l)) / DAY) === 29 - i).length) : null;
  const today = ymdCL(now);
  const month = today.slice(0, 7);
  const bal = (c: OpenCharge) => c.amount - c.paid;
  const overdue = charges.filter((c) => c.due && c.due < today);
  const dueToday = charges.filter((c) => c.due === today);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', hour: '2-digit', hour12: false }).format(new Date(now)));
  const longDate = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(now));
  return {
    now, today, hour, longDate, leads, leadsError: error, week, prevWeek, spark,
    newCount: leads.filter((l) => l.stage === 'nuevo').length,
    stale: leads.filter((l) => l.stage === 'nuevo' && now - t(l) > DAY),
    // Propuesta sin respuesta: lleva más de PROPOSAL_STALE_DAYS en la etapa (updatedAt = último cambio de etapa).
    staleProposals: leads.filter((l) => l.stage === 'propuesta' && now - new Date(l.updatedAt || l.createdAt).getTime() > PROPOSAL_STALE_DAYS * DAY),
    meetingsToday: leads.filter((l) => l.stage === 'reunion' && l.meetingAt && ymdCL(new Date(l.meetingAt).getTime()) === today)
      .sort((a, b) => a.meetingAt!.localeCompare(b.meetingAt!)),
    charges, dueToday, overdue,
    monthDue: charges.length ? charges.filter((c) => c.due?.startsWith(month)).reduce((a, c) => a + bal(c), 0) : null,
    overdueSum: charges.length ? overdue.reduce((a, c) => a + bal(c), 0) : null,
    foundersUsed: k.founders, clients: k.clients, payments: k.payments,
  };
}
