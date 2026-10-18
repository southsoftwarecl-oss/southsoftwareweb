/** CTA final a pantalla completa: orbe magnético + formulario (brief). */
import type { ReactNode } from 'react';
import { BRAND, WA_URL } from '@/content/site';
import ContactForm from '../ContactForm';
import { ArrowIcon } from '../ui';

export default function Final({ n = 8, title, as = 'h2' }: { n?: number; title?: ReactNode; as?: 'h1' | 'h2' }) {
  const H = as;
  return (
    <section className="final" id="contacto">
      <div className="glow" aria-hidden="true" />
      <div className="wrap"><div className="g12">
        <div className="l">
          <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Contacto</div>
          <H data-split="words" style={{ marginTop: 28 }}>{title ?? <>Pongamos tu idea<br />en movimiento.</>}</H>
          <p data-reveal>30 minutos, sin costo. Te decimos con honestidad qué necesitas, cuánto cuesta y en cuánto tiempo.</p>
          <a className="orb" href={WA_URL} target="_blank" rel="noopener noreferrer"><span>Escríbenos<br />por WhatsApp</span><ArrowIcon /></a>
          <div className="direct" data-reveal>
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            {BRAND.phone ? <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`}>{BRAND.phone}</a> : <span className="ph">{BRAND.phoneLabel}</span>}
          </div>
        </div>
        <ContactForm />
      </div></div>
    </section>
  );
}
