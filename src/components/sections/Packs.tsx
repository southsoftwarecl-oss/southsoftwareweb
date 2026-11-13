/**
 * Packs públicos: nombre, qué incluye y CTA de cotización (sin montos).
 * Los valores siguen en content/site.ts para el panel admin.
 * Móvil (<760px): carrusel con scroll-snap, puntos y contador "n / 8" (aria-live).
 */
import { CUSTOM_PACK, FOUNDERS, FOUNDERS_MESSAGE, PACKS, packMessage, waLink } from '@/content/site';
import { Btn, SecHead } from '../ui';

/** Check dibujable (pathLength=1 → strokeDashoffset 1→0). */
const Check = () => (
  <svg className="ck" viewBox="0 0 12 9" fill="none" aria-hidden="true"><path pathLength={1} d="M1 4.6 4.3 7.8 11 1.2" /></svg>
);

/** Ítems visibles en móvil antes de "Ver más". */
const SHORT = 4;

export default function Packs({ n = 5, head = true }: { n?: number; head?: boolean }) {
  // sin encabezado de sección (en /packs el h1 ya es el título) los nombres de pack bajan a h2 para no saltar niveles
  const H = head ? 'h3' : 'h2';
  const total = PACKS.length + 1;
  const start = Math.max(0, PACKS.findIndex((p) => p.featured));
  return (
    <section className="sec sec-packs" id="packs" style={head ? undefined : { paddingTop: 40 }} aria-label={head ? undefined : 'Solo software'}>
      <div className="wrap">
        {head && <SecHead n={n} eyebrow="Nuestros packs" title={<>Elige tu pack.<br /><span className="dim">Cotiza por WhatsApp.</span></>}
          lead="Un pago inicial para construir y una mensualidad que cubre hosting, dominio, respaldos, cambios y soporte. Te cotizamos el pack que calza con tu negocio." />}
        <div className="packs" data-forja>
          {PACKS.map((p) => (
            <article className={`pack${p.featured ? ' feat' : ''}`} key={p.name}>
              <i className="rim" aria-hidden="true"><i /></i>
              {p.featured && <span className="badge">Recomendado<i aria-hidden="true" /></span>}
              <div className="pk-c">
                <H className="pn">{p.name}</H>
                <small className="pl">Pago inicial + mensualidad</small>
                <div className="pr">Pide tu cotización</div>
                <ul className={p.includes.length > SHORT ? 'long' : undefined}>{p.includes.map((x, k) => <li key={x} className={k >= SHORT ? 'pk-x' : undefined}><Check /><span>{x}</span></li>)}</ul>
                {p.includes.length > SHORT && (
                  // móvil: los ítems extra se pliegan para que la tarjeta no crezca (en ≥761px esto se oculta y se ve la lista completa)
                  <details className="pk-more"><summary>Ver {p.includes.length - SHORT} más</summary>
                    <ul>{p.includes.slice(SHORT).map((x) => <li key={x}><Check /><span>{x}</span></li>)}</ul>
                  </details>
                )}
                <Btn href={waLink(packMessage(p))} external variant={p.featured ? 'primary' : 'ghost'} icon={false} lead={{ channel: 'elegir_pack', pack: p.name }}>Cotiza por WhatsApp</Btn>
              </div>
            </article>
          ))}
          <article className="pack">
            <i className="rim" aria-hidden="true"><i /></i>
            <div className="pk-c">
              <H className="pn">{CUSTOM_PACK.name}</H>
              <small className="pl">Según alcance</small>
              <div className="pr">Pide tu cotización</div>
              <ul>{['Sistema interno, reservas o portal', 'Prototipo antes de programar', 'Pago por hitos', 'Soporte mensual'].map((x) => <li key={x}><Check /><span>{x}</span></li>)}</ul>
              <Btn href={waLink(packMessage(CUSTOM_PACK))} external variant="ghost" icon={false} lead={{ channel: 'elegir_pack', pack: CUSTOM_PACK.name }}>Cotiza por WhatsApp</Btn>
            </div>
          </article>
        </div>
        {/* navegación del carrusel móvil (oculta en ≥760px) */}
        <div className="pk-nav">
          <div className="pk-dots">
            {Array.from({ length: total }, (_, i) => (
              <button type="button" key={i} aria-label={`Ir al pack ${i + 1} de ${total}`} aria-current={i === start ? 'true' : undefined}><i /></button>
            ))}
          </div>
          <p className="pk-count mono" aria-live="polite">{start + 1} / {total}</p>
        </div>
        <div className="founders" data-reveal>
          <div><b>{FOUNDERS.title}</b><p>{FOUNDERS.text}</p></div>
          <Btn href={waLink(FOUNDERS_MESSAGE)} external lead={{ channel: 'reservar_cupo' }}>Reservar cupo</Btn>
        </div>
        <p className="fine">Mensualidad sin permanencia con 30 días de aviso. Comisiones de pasarelas de pago y cuentas de desarrollador (Apple/Google) se cobran aparte.</p>
      </div>
    </section>
  );
}
