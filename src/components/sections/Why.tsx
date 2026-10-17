import { WHY } from '@/content/site';
import { SecHead } from '../ui';

export default function Why({ n = 6 }: { n?: number }) {
  return (
    <section className="sec" id="por-que">
      <div className="wrap">
        <SecHead n={n} eyebrow="Por qué nosotros" title={<>Confianza que se<br /><span className="dim">firma por escrito.</span></>} />
        <div className="why" data-stagger>
          {WHY.map(([t, d], i) => <div className="w" key={t}><span className="mono">0{i + 1}</span><h3 className="h4">{t}</h3><p>{d}</p></div>)}
        </div>
      </div>
    </section>
  );
}
