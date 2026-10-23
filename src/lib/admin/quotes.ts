/**
 * Cotizaciones versionadas (migración 0005). Memoria = e2e/local. Supabase = sesión del usuario (RLS + triggers de 0005).
 * Reglas espejo del trigger: solo la última versión es editable y solo en borrador; una sola aceptada por solicitud.
 */
import { leadsBackend } from './leads';
import { supabaseUser } from '@/lib/supabase/server';
import type { Quote, QuoteVersion } from './quotes-shared';
export type { Quote, QuoteVersion, QuoteStatus } from './quotes-shared';

const g = globalThis as unknown as { __ssQuotes?: { quotes: Quote[] } };
const mem = () => (g.__ssQuotes ??= { quotes: [] });
const nowIso = () => new Date().toISOString();

export async function listQuotes(requestId: string): Promise<{ quotes: Quote[]; error?: string }> {
  const be = leadsBackend();
  if (be === 'memory') return { quotes: mem().quotes.filter((q) => q.requestId === requestId) };
  if (be === 'off') return { quotes: [] };
  const sb = await supabaseUser();
  const { data, error } = await sb.from('quotes').select('id,request_id,title,created_at,quote_versions(id,version,items,setup,monthly,notes,status,created_at,decided_at)').eq('request_id', requestId).order('created_at');
  if (error) return { quotes: [], error: error.code === '42P01' ? 'Cotizaciones aún no habilitadas en la base de datos.' : 'No se pudieron leer las cotizaciones.' };
  type R = { id: string; request_id: string; title: string; created_at: string; quote_versions: { id: string; version: number; items: string[]; setup: number; monthly: number; notes: string | null; status: QuoteVersion['status']; created_at: string; decided_at: string | null }[] };
  return { quotes: (data as R[]).map((q) => ({ id: q.id, requestId: q.request_id, title: q.title, createdAt: q.created_at,
    versions: q.quote_versions.sort((a, b) => a.version - b.version).map((v) => ({ id: v.id, version: v.version, items: v.items || [], setup: Number(v.setup), monthly: Number(v.monthly), notes: v.notes, status: v.status, createdAt: v.created_at, decidedAt: v.decided_at })) })) };
}

/** ¿La solicitud tiene una cotización viva (para Propuesta) o aceptada (para Aceptado)? */
export async function quoteState(requestId: string): Promise<{ any: boolean; accepted: boolean }> {
  const { quotes } = await listQuotes(requestId);
  const vs = quotes.flatMap((q) => q.versions);
  return { any: vs.some((v) => ['borrador', 'enviada', 'aceptada'].includes(v.status)), accepted: vs.some((v) => v.status === 'aceptada') };
}

type Draft = { items: string[]; setup: number; monthly: number; notes: string | null };

export async function createQuote(requestId: string, title: string, d: Draft): Promise<{ ok: boolean; error?: string }> {
  if (leadsBackend() === 'memory') {
    mem().quotes.push({ id: crypto.randomUUID(), requestId, title, createdAt: nowIso(), versions: [{ id: crypto.randomUUID(), version: 1, ...d, status: 'borrador', createdAt: nowIso(), decidedAt: null }] });
    return { ok: true };
  }
  const sb = await supabaseUser();
  const q = await sb.from('quotes').insert({ request_id: requestId, title }).select('id').single();
  if (q.error) return { ok: false, error: 'No se pudo crear la cotización.' };
  const v = await sb.from('quote_versions').insert({ quote_id: q.data.id, request_id: requestId, version: 1, ...d });
  return v.error ? { ok: false, error: 'No se pudo guardar la versión.' } : { ok: true };
}

/** Nueva versión (copia editable); la anterior en borrador/enviada pasa a "reemplazada" y queda de solo lectura. */
export async function newVersion(quoteId: string, d: Draft): Promise<{ ok: boolean; error?: string }> {
  if (leadsBackend() === 'memory') {
    const q = mem().quotes.find((x) => x.id === quoteId); if (!q) return { ok: false, error: 'Cotización no encontrada.' };
    const last = q.versions[q.versions.length - 1];
    if (last.status === 'aceptada') return { ok: false, error: 'La versión vigente está aceptada.' };
    if (['borrador', 'enviada'].includes(last.status)) last.status = 'reemplazada';
    q.versions.push({ id: crypto.randomUUID(), version: last.version + 1, ...d, status: 'borrador', createdAt: nowIso(), decidedAt: null });
    return { ok: true };
  }
  const sb = await supabaseUser();
  const { data: q } = await sb.from('quotes').select('request_id').eq('id', quoteId).single();
  if (!q) return { ok: false, error: 'Cotización no encontrada.' };
  const v = await sb.from('quote_versions').insert({ quote_id: quoteId, request_id: q.request_id, version: 1, ...d });
  return v.error ? { ok: false, error: 'No se pudo crear la versión.' } : { ok: true };
}

/** Cambia el estado de la versión VIGENTE: enviada / aceptada / rechazada. Solo una aceptada por solicitud. */
export async function setVersionStatus(versionId: string, status: 'enviada' | 'aceptada' | 'rechazada'): Promise<{ ok: boolean; error?: string }> {
  if (leadsBackend() === 'memory') {
    const q = mem().quotes.find((x) => x.versions.some((v) => v.id === versionId)); if (!q) return { ok: false, error: 'Versión no encontrada.' };
    const v = q.versions.find((x) => x.id === versionId)!;
    if (v !== q.versions[q.versions.length - 1]) return { ok: false, error: 'Las versiones anteriores son de solo lectura.' };
    if (['aceptada', 'rechazada', 'reemplazada'].includes(v.status)) return { ok: false, error: 'La versión ya está cerrada.' };
    if (status === 'aceptada' && mem().quotes.some((x) => x.requestId === q.requestId && x.versions.some((y) => y.status === 'aceptada'))) return { ok: false, error: 'Ya hay una cotización aceptada para esta solicitud.' };
    v.status = status; if (status !== 'enviada') v.decidedAt = nowIso();
    return { ok: true };
  }
  const sb = await supabaseUser();
  const r = await sb.from('quote_versions').update({ status }).eq('id', versionId);
  if (r.error) return { ok: false, error: r.error.code === '23505' ? 'Ya hay una cotización aceptada para esta solicitud.' : r.error.message?.includes('solo lectura') ? 'Las versiones anteriores son de solo lectura.' : 'No se pudo cambiar el estado.' };
  return { ok: true };
}
