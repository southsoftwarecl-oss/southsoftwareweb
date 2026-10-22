'use client';
/**
 * LEGACY (cromo/backlit, hasta oct-2026). Rollback: en Nav/Footer importar LogoLegacy en vez de Logo
 * e importar src/styles/logo-legacy.css (estilos .wm originales).
 *
 * Nítido en cualquier DPR: es texto SVG con textLength (ambas líneas justificadas al mismo ancho).
 * Variantes (cambiar el default en LOGO_VARIANT):
 *  - 'chrome'  cromo cepillado + filo acero-azul fino
 *  - 'backlit' cromo + contraluz azul acero más marcado (como el logo 3D elegido) (default)
 *  - 'steel'   cromo arriba, SOFTWARE en acero espaciado con línea fina
 * El brillo especular solo corre en hover/focus y se desactiva con prefers-reduced-motion.
 */
import { useId } from 'react';

export type LegacyLogoVariant = 'chrome' | 'backlit' | 'steel';
export const LEGACY_LOGO_VARIANT: LegacyLogoVariant = 'backlit';

export default function LogoLegacy({ variant = LEGACY_LOGO_VARIANT, className }: { variant?: LegacyLogoVariant; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const g = `lg-${id}`, sh = `ls-${id}`, cl = `lc-${id}`, gl = `lf-${id}`;
  const steel = variant === 'steel';
  const lines = (
    <>
      <text x="160" y="50" textAnchor="middle" fontSize="54" textLength="312" lengthAdjust="spacingAndGlyphs">SOUTH</text>
      {steel
        ? <text x="160" y="92" textAnchor="middle" fontSize="22" textLength="300" lengthAdjust="spacing">SOFTWARE</text>
        : <text x="160" y="94" textAnchor="middle" fontSize="33" textLength="312" lengthAdjust="spacingAndGlyphs">SOFTWARE</text>}
    </>
  );
  return (
    <svg className={`wm wm-${variant}${className ? ' ' + className : ''}`} viewBox="0 0 320 100" role="img" aria-label="South Software" focusable="false">
      <defs>
        {/* cromo cepillado: bandas horizontales de los tokens chrome-1/2/3 */}
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="c1" /><stop offset=".3" className="c0" /><stop offset=".47" className="c2" />
          <stop offset=".5" className="c3" /><stop offset=".72" className="c1" /><stop offset="1" className="c2" />
        </linearGradient>
        <linearGradient id={sh} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={cl}>{lines}</clipPath>
        <filter id={gl} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={variant === 'backlit' ? 5 : 1.6} />
        </filter>
      </defs>
      {/* filo / contraluz acero-azul */}
      <g className="wm-glow" filter={`url(#${gl})`} aria-hidden="true">{lines}</g>
      <g className="wm-face" fill={`url(#${g})`}>{lines}</g>
      {steel && <rect className="wm-rule" x="10" y="62" width="300" height="1" />}
      <g clipPath={`url(#${cl})`} aria-hidden="true"><rect className="wm-sheen" x="-120" y="0" width="90" height="100" fill={`url(#${sh})`} transform="skewX(-20)" /></g>
    </svg>
  );
}
