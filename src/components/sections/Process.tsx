/** Línea de tiempo que se dibuja con el scroll (6 pasos). */
import { STEPS } from '@/content/site';
import { SecHead } from '../ui';

export default function Process({ n = 3 }: { n?: number }) {
  return (
    <section className="sec" id="proceso">
      <div className="wrap">
        <SecHead n={n} eyebrow="Proceso" title={<>Seis pasos.<br /><span className="dim">Cero sorpresas.</span></>}
          lead="Sabes qué pasa, cuándo y cuánto cuesta en cada etapa. Plazos referenciales para un sitio Pyme." />
        <div className="tl">
          <div className="rail" aria-hidden="true"><b /></div>
          {STEPS.map((s, i) => (
            <div className="st" key={s.title}><span className="node" aria-hidden="true" /><div className="c"><span className="mono">0{i + 1} · {s.when}</span><h3 className="h4">{s.title}</h3><p>{s.desc}</p></div></div>
          ))}
        </div>
      </div>
    </section>
  );
}
