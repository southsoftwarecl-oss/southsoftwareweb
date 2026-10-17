/** Marquee de tecnologías + contadores (solo datos reales). */
import { COUNTERS, MARQUEE } from '@/content/site';
import { TechIcon } from '../ui';

export default function Proof() {
  return (
    <section className="proof" aria-label="Tecnologías y datos">
      <div className="wrap"><p className="mono" style={{ color: 'var(--dim)', padding: '44px 0 28px' }}>Tecnología con la que construimos</p></div>
      <div className="marquee" aria-hidden="true">
        <div className="track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => <span className="tech" key={i}><TechIcon />{t}</span>)}
        </div>
      </div>
      <p className="sr-only">Tecnologías: {MARQUEE.join(', ')}.</p>
      <div className="wrap">
        <div className="counters" data-stagger>
          {COUNTERS.map((c) => (
            <div className="counter" key={c.label}><b data-count={c.value} data-pad="2">{String(c.value).padStart(2, '0')}</b><span>{c.label}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}
