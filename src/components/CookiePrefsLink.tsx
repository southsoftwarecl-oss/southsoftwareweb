'use client';
/** Link del footer que reabre el aviso de cookies (solo se renderiza si hay GA configurado). */
import { openCookiePrefs } from '@/lib/analytics';

export default function CookiePrefsLink() {
  return (
    <button type="button" className="cookie-link" onClick={openCookiePrefs} aria-haspopup="dialog">
      Preferencias de cookies
    </button>
  );
}
