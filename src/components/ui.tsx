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

/** Glifo oficial de WhatsApp (forma de Simple Icons, CC0). */
export const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
)

/** Inserta JSON-LD de forma segura (escapa `<` para evitar cierre de </script>). */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  // eslint-disable-next-line react/no-danger -- contenido estático serializado y escapado (ver docs Next.js: JSON-LD)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
