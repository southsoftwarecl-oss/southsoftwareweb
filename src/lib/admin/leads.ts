/**
 * Solicitudes (requests): guardado desde la web y lectura para el panel.
 * Backends: Supabase (si hay env) · memoria (SOLO e2e/local con LEADS_STORE=memory, nunca en producción) · desactivado.
 */
import { supabaseConfigured } from '@/lib/supabase/env';
import { supabaseUser, supabaseWriter } from '@/lib/supabase/server';
import type { ChannelId, StageId } from './model';

export type LeadInput = {
  channel: ChannelId; payload: Record<string, unknown>;
  name?: string | null; email?: string | null; phone?: string | null; message?: string | null;
  pack?: string | null; builder?: Record<string, unknown> | null; setup?: number | null; monthly?: number | null;
  referrer?: string | null; ipHash?: string | null; userAgent?: string | null;
};
export type Lead = LeadInput & { id: string; stage: StageId; createdAt: string };

type Mem = { leads: Lead[] };
const g = globalThis as unknown as { __ssLeads?: Mem };
const memoryMode = () => process.env.LEADS_STORE === 'memory' && process.env.VERCEL_ENV !== 'production';
const mem = () => (g.__ssLeads ??= { leads: [] });

export function leadsBackend(): 'supabase' | 'memory' | 'off' {
  if (memoryMode()) return 'memory';
  return supabaseConfigured() ? 'supabase' : 'off';
}

/** IP → hash (nunca guardamos la IP cruda). */
export async function hashIp(ip: string) {
  const salt = process.env.LEADS_IP_SALT || 'southsoftware';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + ip));
  return Array.from(new Uint8Array(d).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function saveLead(l: LeadInput): Promise<boolean> {
  if (l.channel === 'manual') return false; // la web nunca crea solicitudes manuales
  const be = leadsBackend();
  if (be === 'off') return false;
  if (be === 'memory') {
    mem().leads.unshift({ ...l, id: crypto.randomUUID(), stage: 'nuevo', createdAt: new Date().toISOString() });
    return true;
  }
  const { client } = supabaseWriter();
  // Sin .select(): con la publishable key la política permite INSERT pero no leer.
  const { error } = await client.from('requests').insert({
    channel: l.channel, payload: l.payload, name: l.name ?? null, email: l.email ?? null, phone: l.phone ?? null, message: l.message ?? null,
    builder_config: l.builder ? { ...l.builder, pack: l.pack ?? null } : l.pack ? { pack: l.pack } : null,
    shown_setup: l.setup ?? null, shown_monthly: l.monthly ?? null, referrer: l.referrer ?? null, ip_hash: l.ipHash ?? null, user_agent: l.userAgent?.slice(0, 300) ?? null,
  });
  if (error) console.error('[leads] no se pudo guardar', error.code);
  return !error;
}

type Row = { id: string; channel: Lead['channel']; stage: StageId; payload: Record<string, unknown>; name: string | null; email: string | null; phone: string | null; message: string | null; builder_config: { pack?: string } | null; shown_setup: number | null; shown_monthly: number | null; created_at: string };

export async function listLeads(): Promise<{ leads: Lead[]; error?: string }> {
  const be = leadsBackend();
  if (be === 'memory') return { leads: mem().leads };
  if (be === 'off') return { leads: [], error: 'Base de datos no configurada.' };
  const sb = await supabaseUser();
  const { data, error } = await sb.from('requests').select('id,channel,stage,payload,name,email,phone,message,builder_config,shown_setup,shown_monthly,created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(500);
  if (error) return { leads: [], error: 'No se pudieron leer las solicitudes.' };
  return { leads: (data as Row[]).map((r) => ({ id: r.id, channel: r.channel, stage: r.stage, payload: r.payload, name: r.name, email: r.email, phone: r.phone, message: r.message, pack: r.builder_config?.pack ?? null, builder: r.builder_config, setup: r.shown_setup, monthly: r.shown_monthly, createdAt: r.created_at })) };
}

/** Solicitud ingresada a mano por el equipo (canal "manual"). Usa la sesión del usuario: RLS exige rol owner/admin/ventas. */
export async function saveManualLead(l: Omit<LeadInput, 'channel'>): Promise<boolean> {
  const be = leadsBackend();
  if (be === 'off') return false;
  if (be === 'memory') { mem().leads.unshift({ ...l, channel: 'manual', id: crypto.randomUUID(), stage: 'nuevo', createdAt: new Date().toISOString() }); return true; }
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('requests').insert({
    channel: 'manual', payload: l.payload, name: l.name ?? null, email: l.email ?? null, phone: l.phone ?? null, message: l.message ?? null,
    builder_config: l.pack ? { pack: l.pack } : null, shown_setup: l.setup ?? null, shown_monthly: l.monthly ?? null, owner: user?.id ?? null,
  });
  if (error) console.error('[leads] manual no guardada', error.code);
  return !error;
}

export async function moveLead(id: string, stage: StageId): Promise<boolean> {
  const be = leadsBackend();
  if (be === 'memory') { const l = mem().leads.find((x) => x.id === id); if (l) l.stage = stage; return !!l; }
  if (be === 'off') return false;
  const sb = await supabaseUser();
  const { error } = await sb.from('requests').update({ stage, updated_at: new Date().toISOString() }).eq('id', id);
  if (!error) await sb.from('request_events').insert({ request_id: id, kind: 'stage', data: { to: stage } });
  return !error;
}

/** Helpers de tiempo (fuera del render para mantener los componentes puros). */
export const nowMs = () => Date.now();
export const ageHours = (iso: string, now = nowMs()) => (now - new Date(iso).getTime()) / 3_600_000;
