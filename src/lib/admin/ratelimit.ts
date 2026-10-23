/**
 * Límite de intentos de login: 5 fallos / 15 min por IP (hasheada con sal).
 * Compartido entre instancias vía Supabase (migración 0004: RPC login_rate_allowed / login_rate_fail).
 * Si la migración aún no está aplicada o Supabase no responde, cae al contador en memoria (comportamiento anterior).
 */
import { supabaseConfigured } from '@/lib/supabase/env';
import { supabaseWriter } from '@/lib/supabase/server';
import { hashIp } from './leads';

const WINDOW = 15 * 60 * 1000;
const MAX = 5;
const mem = new Map<string, number[]>();
const memList = (k: string, now: number) => (mem.get(k) || []).filter((t) => now - t < WINDOW);
const shared = () => supabaseConfigured() && process.env.LEADS_STORE !== 'memory';

export async function loginKey(ip: string) { return 'login:' + (await hashIp(ip)); }

export async function loginAllowed(key: string): Promise<boolean> {
  if (shared()) {
    const { data, error } = await supabaseWriter().client.rpc('login_rate_allowed', { p_key: key });
    if (!error && typeof data === 'boolean') return data;
  }
  return memList(key, Date.now()).length < MAX;
}

export async function loginFailed(key: string): Promise<void> {
  const now = Date.now();
  mem.set(key, [...memList(key, now), now]); // siempre también en memoria (respaldo)
  if (shared()) await supabaseWriter().client.rpc('login_rate_fail', { p_key: key }).then(() => undefined, () => undefined);
}

/** Éxito: limpia solo el respaldo local; en BD los fallos vencen solos (no hay RPC de borrado para que nadie pueda resetear). */
export function loginSucceeded(key: string) { mem.delete(key); }
