/** Packs con precio publicado (valores exactos en content/site.ts). */
import { FOUNDERS, PACKS, WA_URL } from '@/content/site';
import { Btn, SecHead } from '../ui';

export default function Packs({ n = 5, head = true }: { n?: number; head?: boolean }) {
  // sin encabezado de sección (en /packs el h1 ya es el título) los nombres de pack bajan a h2 para no saltar niveles
  const H = head ? 'h3' : 'h2';
  return (
    <section className="sec" id="packs" style={head ? undefined : { paddingTop: 40 }} aria-label={head ? undefined : 'Packs y precios'}>
      <div className="wrap">
        {head && <SecHead n={n} eyebrow="Packs y precios" title={<>Precio claro.<br /><span className="dim">Desde el primer día.</span></>}
          lead="Un pago inicial para construir y una mensualidad que cubre hosting, dominio, respaldos, cambios y soporte. Valores brutos con boleta de honorarios." />}
        <div className="packs" data-stagger>
          {PACKS.map((p) => (
            <article className={`pack${p.featured ? ' feat' : ''}`} key={p.name}>
              {p.featured && <span className="badge">Recomendado</span>}
              <H className="pn">{p.name}</H>
              <div className="pr"><small>Pago inicial</small>{p.setup}</div>
              <div className="mo">+ <b>{p.monthly}</b> / mes</div>
              <ul>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              <Btn href={WA_URL} external variant={p.featured ? 'primary' : 'ghost'} icon={false}>Elegir pack</Btn>
            </article>
          ))}
          <article className="pack">
            <H className="pn">Software a medida</H>
            <div className="pr"><small>Por alcance</small>Cotización</div>
            <div className="mo">Escritorio, ERP, integraciones</div>
            <ul><li>Levantamiento de procesos</li><li>Prototipo antes de programar</li><li>Pago por hitos</li><li>Soporte mensual opcional</li></ul>
            <Btn href="/contacto" variant="ghost" icon={false}>Conversemos</Btn>
          </article>
        </div>
        <div className="founders" data-reveal>
          <div><b>{FOUNDERS.title}</b><p>{FOUNDERS.text}</p></div>
          <Btn href={WA_URL} external>Reservar cupo</Btn>
        </div>
        <p className="fine">Mensualidad sin permanencia con 30 días de aviso. Comisiones de pasarelas de pago y cuentas de desarrollador (Apple/Google) se cobran aparte.</p>
      </div>
    </section>
  );
}
