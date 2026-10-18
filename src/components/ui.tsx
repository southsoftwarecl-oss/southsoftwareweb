/**
 * Piezas de UI compartidas (server components): botón con text-roll,
 * encabezado de sección, íconos. Mismo markup que el preview.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { IconName } from '@/content/site';

export const ArrowIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);

type BtnProps = { href: string; children: string; variant?: 'primary' | 'ghost' | 'light'; icon?: boolean; external?: boolean; className?: string };
/** Botón píldora con texto que rueda al hover (y magnético vía MotionRoot). */
export function Btn({ href, children, variant = 'primary', icon = variant === 'primary', external, className = '' }: BtnProps) {
  const cls = `btn btn-${variant} ${className}`.trim();
  const inner = (<><span className="t"><span>{children}</span><span aria-hidden="true">{children}</span></span>{icon && <ArrowIcon />}</>);
  if (external) return <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  if (href.startsWith('#') || href.startsWith('mailto:')) return <a className={cls} href={href}>{inner}</a>;
  return <Link className={cls} href={href}>{inner}</Link>;
}

/** Encabezado de sección: (NN) eyebrow + h2 con reveal por palabra + lead opcional. */
export function SecHead({ n, eyebrow, title, lead, as = 'h2' }: { n: number; eyebrow: string; title: ReactNode; lead?: ReactNode; as?: 'h1' | 'h2' }) {
  const H = as;
  return (
    <div className="sec-head">
      <div>
        <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>{eyebrow}</div>
        <H className="h2" data-split="words">{title}</H>
      </div>
      {lead && <p className="lead" data-reveal>{lead}</p>}
    </div>
  );
}

/** Íconos animados (trazos que se dibujan al hover). */
const ANIC: Record<IconName, ReactNode> = {
  code: <><path pathLength={1} d="m16 18 6-6-6-6" /><path pathLength={1} d="m8 6-6 6 6 6" /><path pathLength={1} d="m14 4-4 16" /></>,
  monitor: <><rect pathLength={1} x="2" y="3" width="20" height="14" rx="2" /><path pathLength={1} d="M8 21h8M12 17v4" /></>,
  globe: <><circle pathLength={1} cx="12" cy="12" r="10" /><path pathLength={1} d="M2 12h20" /><path pathLength={1} d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" /></>,
  phone: <><rect pathLength={1} x="5" y="2" width="14" height="20" rx="3" /><path pathLength={1} d="M10 18h4" /></>,
  shield: <><path pathLength={1} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path pathLength={1} d="m9 12 2 2 4-4" /></>,
  chart: <><path pathLength={1} d="M3 3v18h18" /><path pathLength={1} d="m7 15 4-4 3 3 6-7" /></>,
  cart: <><path pathLength={1} d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 7H6" /><circle pathLength={1} cx="10" cy="20" r="1.4" /><circle pathLength={1} cx="17" cy="20" r="1.4" /></>,
};
export const AIcon = ({ name }: { name: IconName }) => (
  <svg className="aicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ANIC[name]}</svg>
);

export const TechIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
);

export const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2z" /></svg>
);

/** Inserta JSON-LD de forma segura (escapa `<` para evitar cierre de </script>). */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  // eslint-disable-next-line react/no-danger -- contenido estático serializado y escapado (ver docs Next.js: JSON-LD)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
