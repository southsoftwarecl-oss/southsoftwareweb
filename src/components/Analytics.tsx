'use client';
/**
 * GA4 con Google Consent Mode v2 + aviso de cookies (es-CL).
 *
 * - Solo se monta si hay NEXT_PUBLIC_GA_ID (ver layout.tsx).
 * - Consent Mode v2: `default` deniega analytics_storage, ad_storage, ad_user_data y
 *   ad_personalization. Con "Aceptar" se actualiza SOLO analytics_storage a granted
 *   (no usamos publicidad: los tres de ads quedan denegados siempre).
 * - gtag.js (next/script, afterInteractive) se descarga recién tras "Aceptar":
 *   sin consentimiento no hay ninguna petición a Google.
 * - page_view: el `config` inicial envía la vista de la página actual y las navegaciones
 *   del App Router (history.pushState) las mide la "Medición mejorada" de GA4
 *   ("Cambios de página según eventos del historial", activa por defecto). No se envían
 *   page_view manuales → sin doble conteo.
 * - Eventos (delegación de clicks, sin tocar los componentes): whatsapp_click (+ pack),
 *   select_pack ("Elegir pack"), email_click, phone_click y generate_lead (trackLead()).
 * - Aviso: diálogo no modal fijo abajo (sin CLS), no roba el foco en la primera visita;
 *   al reabrirlo desde el footer recibe el foco y Escape lo cierra. Respeta reduced motion (CSS).
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Script from 'next/script';
import {
  CONSENT_EVENT, CONSENT_KEY, LEAD_EVENT, OPEN_PREFS_EVENT, isWhatsApp, packFromWhatsApp, readConsent, writeConsent,
  type Consent,
} from '@/lib/analytics';

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag; __southGa?: string }
}

/* Store externo: la decisión vive en localStorage; 'ssr' mientras no hay window (sin aviso en el HTML estático). */
type Snap = Consent | 'unset' | 'ssr';
const subscribe = (cb: () => void) => {
  const onStorage = (e: StorageEvent) => { if (e.key === CONSENT_KEY) cb(); };
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(CONSENT_EVENT, cb); window.removeEventListener('storage', onStorage); };
};
const getSnap = (): Snap => readConsent() ?? 'unset';
const getServerSnap = (): Snap => 'ssr';

function gtag(...args: unknown[]) {
  window.gtag?.(...args);
}

/** Cola de gtag + consentimiento por defecto (idempotente). Debe correr antes de `config`. */
function bootGtag(id: string) {
  if (window.__southGa === id) return;
  window.__southGa = id;
  window.dataLayer = window.dataLayer || [];
  // gtag.js espera objetos `arguments` en la cola (no arrays).
  window.gtag = function gtagQueue() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500,
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', id);
}

/** Al rechazar después de haber aceptado: borra las cookies _ga de este dominio y del dominio raíz. */
function clearGaCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host.split('.').slice(-2).join('.')}`];
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_|$)/.test(n)).forEach((n) => {
    domains.forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`; });
  });
}

export default function Analytics({ gaId }: { gaId: string }) {
  const consent = useSyncExternalStore(subscribe, getSnap, getServerSnap);
  const [reopened, setReopened] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const granted = consent === 'granted';
  const open = consent === 'unset' || reopened;

  // Consentimiento → cola de gtag (antes de que cargue gtag.js); revocación → denied + limpiar cookies.
  useEffect(() => {
    if (granted) bootGtag(gaId);
    else if (consent === 'denied' && window.__southGa) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      clearGaCookies();
    }
  }, [granted, consent, gaId]);

  // Eventos de conversión (solo con consentimiento).
  useEffect(() => {
    if (!granted) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.href;
      const page_path = location.pathname;
      const label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (isWhatsApp(href)) {
        const pack = packFromWhatsApp(href);
        gtag('event', 'whatsapp_click', { pack, page_path, link_text: label.slice(0, 100) });
        if (/elegir pack/i.test(label)) gtag('event', 'select_pack', { pack, page_path });
      } else if (href.startsWith('mailto:')) {
        gtag('event', 'email_click', { page_path });
      } else if (href.startsWith('tel:')) {
        gtag('event', 'phone_click', { page_path });
      }
    };
    const onLead = (e: Event) => {
      const form = (e as CustomEvent<{ form?: string }>).detail?.form || 'contacto';
      gtag('event', 'generate_lead', { form, page_path: location.pathname });
    };
    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener(LEAD_EVENT, onLead);
    return () => { document.removeEventListener('click', onClick, { capture: true }); window.removeEventListener(LEAD_EVENT, onLead); };
  }, [granted]);

  // "Preferencias de cookies" (footer) → reabrir y enfocar.
  useEffect(() => {
    const onOpen = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setReopened(true);
      requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }));
    };
    window.addEventListener(OPEN_PREFS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, onOpen);
  }, []);

  const close = useCallback(() => {
    setReopened(false);
    const back = returnFocus.current;
    returnFocus.current = null;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
  }, []);

  const choose = (v: Consent) => { writeConsent(v); close(); };

  if (consent === 'ssr') return null;

  return (
    <>
      {granted && (
        <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
      )}
      <div
        ref={dialog}
        className="cookie"
        data-open={open ? '' : undefined}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
        inert={!open}
        onKeyDown={(e) => { if (e.key === 'Escape' && consent !== 'unset') { e.stopPropagation(); close(); } }}
      >
        <p className="cookie-eyebrow" id="cookie-title">Cookies</p>
        <p className="cookie-desc" id="cookie-desc">
          Usamos solo cookies de analítica (Google Analytics) para saber qué páginas sirven y mejorar el sitio.
          Sin publicidad ni venta de datos.
        </p>
        <div className="cookie-actions">
          <button type="button" className="cookie-btn cookie-ghost" onClick={() => choose('denied')} aria-pressed={consent === 'denied'}>Rechazar</button>
          <button type="button" className="cookie-btn cookie-primary" onClick={() => choose('granted')} aria-pressed={granted}>Aceptar</button>
        </div>
      </div>
    </>
  );
}
