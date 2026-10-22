/**
 * Sesión del panel — FASE 1 (provisoria, sin infraestructura nueva).
 * Cookie firmada con HMAC-SHA256 (Web Crypto, sirve en proxy y en servidor). Secretos SOLO por env:
 *   ADMIN_PASSWORD        contraseña de acceso (solo servidor)
 *   ADMIN_SESSION_SECRET  clave de firma (≥ 32 caracteres, solo servidor)
 * Si falta cualquiera de las dos, el panel queda DESACTIVADO (nadie entra).
 * Fase 2+: se reemplaza por Supabase Auth + MFA TOTP (aal2) y roles en tabla `staff` (ver docs/admin/ARQUITECTURA.md).
 */
export const SESSION_COOKIE = 'ss_admin';
export const SESSION_TTL_S = 8 * 60 * 60; // 8 h

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export function adminConfigured() {
  return !!process.env.ADMIN_PASSWORD && (process.env.ADMIN_SESSION_SECRET || '').length >= 32;
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(process.env.ADMIN_SESSION_SECRET || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Comparación en tiempo constante (sobre hashes, para no filtrar largo). */
export async function safeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createSession(now = Date.now()) {
  const payload = `owner.${Math.floor(now / 1000) + SESSION_TTL_S}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(token: string | undefined, now = Date.now()) {
  if (!token || !adminConfigured()) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const exp = Number(payload.split('.')[1]);
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  return safeEqual(token.slice(i + 1), await hmac(payload));
}
