/** Testimonios: PLACEHOLDER visible. Reemplazar solo con testimonios reales y autorizados. */
import { SecHead } from '../ui';

export default function Testimonials({ n = 7 }: { n?: number }) {
  return (
    <section className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <SecHead n={n} eyebrow="Testimonios" title={<>Lo que dirán<br /><span className="dim">nuestros clientes.</span></>}
          lead="No inventamos opiniones. Estos espacios se completan con testimonios reales y autorizados." />
        <div className="testi" data-stagger>
          {[0, 1, 2].map((i) => (
            <figure className="tq" key={i}>
              <span className="pill">Espacio reservado</span>
              <blockquote className="q">“Aquí irá el testimonio real de un cliente, publicado con su autorización.”</blockquote>
              <figcaption className="who"><span className="av" /><span>Nombre del cliente<br />Empresa · Cargo</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
