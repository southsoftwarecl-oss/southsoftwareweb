/** Testimonios: solo con datos reales y autorizados (TESTIMONIALS). Vacío → no se renderiza. */
import { TESTIMONIALS } from '@/content/site';
import { SecHead } from '../ui';

export default function Testimonials({ n = 7 }: { n?: number }) {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="sec">
      <div className="wrap">
        <SecHead n={n} eyebrow="Testimonios" title={<>Lo que dicen<br /><span className="dim">nuestros clientes.</span></>} />
        <div className="testi" data-stagger>
          {TESTIMONIALS.map((t) => (
            <figure className="tq" key={t.name}>
              <blockquote className="q">“{t.quote}”</blockquote>
              <figcaption className="who"><span>{t.name}<br />{t.company}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
