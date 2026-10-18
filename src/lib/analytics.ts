/**
 * Analítica (GA4 + Consent Mode v2) — utilidades compartidas, sin dependencias.
 * - GA_ID / GSC_VERIFICATION vienen de variables públicas (se inyectan en el build).
 *   Sin NEXT_PUBLIC_GA_ID no se renderiza ni el script ni el aviso de cookies.
 * - La decisión del usuario vive en localStorage (CONSENT_KEY). gtag.js solo se descarga
 *   después de "Aceptar": con "Rechazar" no sale ninguna petición a Google.
 * - Los componentes no llaman a gtag directamente: emiten eventos de ventana
 *   (trackLead) que <Analytics> traduce a GA solo si hay consentimiento.
 */

export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID || '').trim();
export const GSC_VERIFICATION = (process.env.NEXT_PUBLIC_GSC_VERIFICATION || '').trim();

export const CONSENT_KEY = 'south-consent';
export const CONSENT_EVENT = 'south:consent';
export const OPEN_PREFS_EVENT = 'south:cookie-prefs';
export const LEAD_EVENT = 'south:lead';

export type Consent = 'granted' | 'denied';

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = (JSON.parse(raw) as { analytics?: string }).analytics;
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, analytics: v, ts: new Date().toISOString() }));
  } catch { /* modo privado sin storage: la decisión vale solo para esta vista */ }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Abre el aviso de cookies (link "Preferencias de cookies" del footer). */
export const openCookiePrefs = () => window.dispatchEvent(new Event(OPEN_PREFS_EVENT));

/** Formulario enviado con éxito → generate_lead (solo se envía si hubo "Aceptar"). */
export const trackLead = (form: string) => window.dispatchEvent(new CustomEvent(LEAD_EVENT, { detail: { form } }));

/** Nombre del pack a partir del texto precargado de un link de WhatsApp (packMessage / FOUNDERS_MESSAGE). */
export function packFromWhatsApp(href: string): string | undefined {
  try {
    const text = new URL(href).searchParams.get('text') || '';
    const m = /\bpack\s+(.+?)\s*\(/i.exec(text);
    if (m) return m[1];
    if (/cliente fundador/i.test(text)) return 'Cliente Fundador';
  } catch { /* href inválido */ }
  return undefined;
}

export const isWhatsApp = (href: string) => /^https:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href);
