/**
 * Cobros abiertos y registro de pagos. Solo lectura/escritura con la sesión del usuario (RLS: pagos = owner/admin).
 * Memoria (LEADS_STORE=memory, solo e2e/local) arranca vacía; e2e puede sembrar con seedMemoryCharge.
 */
import { leadsBackend } from './leads';
import { supabaseUser } from '@/lib/supabase/server';

import { METHODS, type MethodId, type OpenCharge } from './charges-shared';
export { METHODS, type MethodId, type OpenCharge };
type Pay = { chargeId: string; amount: number; paidOn: string; method: MethodId; note: string | null };

const g = globalThis as unknown as { __ssCharges?: { charges: OpenCharge[]; payments: Pay[] } };
const mem = () => (g.__ssCharges ??= { charges: [], payments: [] });
export function seedMemoryCharge(c: OpenCharge) { if (leadsBackend() === 'memory') mem().charges.push(c); }

export async function listOpenCharges(): Promise<{ charges: OpenCharge[]; error?: string }> {
  const be = leadsBackend();
  if (be === 'memory') return { charges: mem().charges.filter((c) => c.paid < c.amount && c.status !== 'anulado') };
  if (be === 'off') return { charges: [], error: 'Base de datos no configurada.' };
  const sb = await supabaseUser();
  const { data, error } = await sb.from('charges')
    .select('id,concept,amount,due_date,status,payments(amount),subscriptions(clients(name,company))')
    .not('status', 'in', '(pagado,anulado)').order('due_date', { ascending: true, nullsFirst: false }).limit(200);
  if (error) return { charges: [], error: 'No se pudieron leer los cobros.' };
  type R = { id: string; concept: string; amount: number; due_date: string | null; status: string; payments: { amount: number }[] | null; subscriptions: { clients: { name: string; company: string | null } | null } | null };
  return { charges: (data as unknown as R[]).map((r) => ({
    id: r.id, concept: r.concept, amount: Number(r.amount), due: r.due_date, status: r.status,
    paid: (r.payments || []).reduce((a, p) => a + Number(p.amount), 0),
    client: r.subscriptions?.clients ? [r.subscriptions.clients.name, r.subscriptions.clients.company].filter(Boolean).join(' · ') : 'Cliente',
  })) };
}

/** Registra un pago (total o parcial) y actualiza el estado del cobro: pagado si cubre el saldo, si no parcial. */
export async function registerPayment(p: Pay): Promise<{ ok: true; status: 'pagado' | 'parcial' } | { ok: false; error: string }> {
  const { charges } = await listOpenCharges();
  const c = charges.find((x) => x.id === p.chargeId);
  if (!c) return { ok: false, error: 'El cobro no existe o ya está pagado.' };
  const balance = c.amount - c.paid;
  if (p.amount > balance) return { ok: false, error: `El monto supera el saldo pendiente (${balance.toLocaleString('es-CL')}).` };
  const status = p.amount === balance ? 'pagado' : 'parcial';
  if (leadsBackend() === 'memory') { mem().payments.push(p); c.paid += p.amount; c.status = status; return { ok: true, status }; }
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  const ins = await sb.from('payments').insert({ charge_id: p.chargeId, amount: p.amount, paid_on: p.paidOn, method: p.method, method_note: p.note, reconciled_by: user?.id ?? null });
  if (ins.error) return { ok: false, error: ins.error.code === '42501' ? 'Tu rol no puede registrar pagos.' : 'No se pudo registrar el pago.' };
  await sb.from('charges').update({ status, updated_at: new Date().toISOString() }).eq('id', p.chargeId);
  return { ok: true, status };
}
