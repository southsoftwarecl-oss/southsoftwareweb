/** CTA final a pantalla completa: orbe magnético + formulario (brief). */
import type { ReactNode } from 'react';
import { BRAND } from '@/content/site';
import ContactForm from '../ContactForm';

export default function Final({ n = 8, title, as = 'h2' }: { n?: number; title?: ReactNode; as?: 'h1' | 'h2' }) {
  const H = as;
  return (
    <section className="final" id="contacto">
      <div className="wrap"><div className="g12">
        <div className="l">
          <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Contacto</div>
          <H data-split="words" style={{ marginTop: 28 }}>{title ?? <>Pongamos tu idea<br />en movimiento.</>}</H>
          <p data-reveal>30 minutos, sin costo. Te decimos con honestidad qué necesitas, cuánto cuesta y en cuánto tiempo.</p>
          <div className="direct" data-reveal>
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            <a href={`tel:${BRAND.phoneE164}`}>{BRAND.phone}</a>
          </div>
        </div>
        <ContactForm />
      </div></div>
    </section>
  );
}
