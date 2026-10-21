/** Grupo de packs Combinados / Solo marketing (valores exactos de content/site.ts) con WhatsApp precargado. */
import './marketing.css';
import { packMessage, waLink, type MktPack } from '@/content/site';
import { Btn } from '../ui';

export default function PackGroup({ id, title, lead, packs, setupLabel, note }: { id: string; title: string; lead: string; packs: MktPack[]; setupLabel: string; note?: string }) {
  return (
    <section className="sec mkp-sec" id={id} aria-labelledby={`${id}-t`}>
      <div className="wrap">
        <div className="mkp-head">
          <h2 className="h3" id={`${id}-t`}>{title}</h2>
          <p className="lead">{lead}</p>
        </div>
        <div className="mkp-grid">
          {packs.map((p) => (
            <article className={`mkp${p.featured ? ' feat' : ''}`} key={p.name} data-pack={p.name}>
              {p.featured && <span className="badge">Recomendado</span>}
              <h3 className="mkp-n">{p.name}</h3>
              {p.tag && <small className="mkp-tag mono">{p.tag}</small>}
              <small className="pl">{setupLabel}</small>
              <div className="mkp-setup">{p.setup}</div>
              {p.launch
                ? <div className="mkp-mo">+ <b>{p.launch}</b> / mes <span className="mkp-launch">los 3 primeros meses, luego {p.monthly}/mes</span></div>
                : <div className="mkp-mo">+ <b>{p.monthly}</b> / mes</div>}
              <ul>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              {p.ideal && <p className="mkp-ideal">Ideal para: {p.ideal}</p>}
              <Btn href={waLink(packMessage(p))} external variant={p.featured ? 'primary' : 'ghost'} icon={false} className="mkp-btn">Elegir pack</Btn>
            </article>
          ))}
        </div>
        {note && <p className="fine">{note}</p>}
      </div>
    </section>
  );
}
