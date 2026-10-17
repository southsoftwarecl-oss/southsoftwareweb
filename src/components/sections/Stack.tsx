/** Grilla de tecnologías con tooltips. */
import { STACK } from '@/content/site';
import { SecHead } from '../ui';

export default function Stack({ n = 4 }: { n?: number }) {
  return (
    <section className="sec" id="stack" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <SecHead n={n} eyebrow="Stack" title={<>Herramientas serias.<br /><span className="dim">Elegidas por una razón.</span></>}
          lead="Pasa el cursor sobre cada tecnología para ver para qué la usamos." />
        <div className="stack" data-stagger>
          {STACK.map(([name, cat, desc]) => (
            <div className="t" key={name} tabIndex={0}><small>{cat}</small><b>{name}</b><div className="tip" role="tooltip">{desc}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}
