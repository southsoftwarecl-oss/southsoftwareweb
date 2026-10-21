/** Prueba social: franja de clientes reales (monocromo, marquee lento) + contador real + propuestas de valor. */
import { CLIENTS, COUNTERS, VALUE_PROPS } from '@/content/site';

export default function Proof() {
  return (
    <section className="proof" aria-label="Clientes y datos">
      <div className="wrap"><p className="eyebrow-s mono">Confían en nosotros</p></div>
      <div className="marquee clients" aria-hidden="true">
        <div className="track">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((t, i) => <span className="client" key={i}>{t}</span>)}
        </div>
      </div>
      <p className="sr-only">Clientes: {CLIENTS.join(', ')}.</p>
      <div className="wrap">
        <div className="counters" data-stagger>
          {COUNTERS.map((c) => (
            <div className="counter" key={c.label}><b data-count={c.value} data-pad="2">{String(c.value).padStart(2, '0')}</b><span>{c.label}</span></div>
          ))}
          {VALUE_PROPS.map(([t, d]) => (
            <div className="counter vp" key={t}><b className="vp-t">{t}</b><span>{d}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}
