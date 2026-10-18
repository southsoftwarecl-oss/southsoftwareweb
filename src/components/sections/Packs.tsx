/**
 * Packs con precio publicado (valores exactos en content/site.ts).
 * Motion "Forja de cromo" en lib/packs-motion.ts: el SSR renderiza SIEMPRE el precio final;
 * el JS solo lo envuelve en columnas de odómetro (aria-hidden) y deja el valor en aria-label + texto sr-only.
 * Móvil (<760px): carrusel con scroll-snap, puntos y contador "n / 8" (aria-live).
 */
import { FOUNDERS, FOUNDERS_MESSAGE, PACKS, packMessage, waLink } from '@/content/site';
import { Btn, SecHead } from '../ui';

/** "desde $1.490.000" → { from: true, amount: "$1.490.000" }. No cambia el valor, solo separa el prefijo. */
export function splitPrice(v: string) {
  const m = /^(desde)\s+(.+)$/i.exec(v.trim());
  return m ? { from: m[1], amount: m[2] } : { from: '', amount: v };
}

/** Monto que el odómetro hace rodar (el JS lo envuelve; sin JS queda como texto). */
const Odo = ({ v }: { v: string }) => <span className="odo" data-odo={v}>{v}</span>;

/** Check dibujable (pathLength=1 → strokeDashoffset 1→0). */
const Check = () => (
  <svg className="ck" viewBox="0 0 12 9" fill="none" aria-hidden="true"><path pathLength={1} d="M1 4.6 4.3 7.8 11 1.2" /></svg>
);

export default function Packs({ n = 5, head = true }: { n?: number; head?: boolean }) {
  // sin encabezado de sección (en /packs el h1 ya es el título) los nombres de pack bajan a h2 para no saltar niveles
  const H = head ? 'h3' : 'h2';
  const total = PACKS.length + 1;
  const start = Math.max(0, PACKS.findIndex((p) => p.featured));
  return (
    <section className="sec sec-packs" id="packs" style={head ? undefined : { paddingTop: 40 }} aria-label={head ? undefined : 'Packs y precios'}>
      <div className="wrap">
        {head && <SecHead n={n} eyebrow="Packs y precios" title={<>Precio claro.<br /><span className="dim">Desde el primer día.</span></>}
          lead="Un pago inicial para construir y una mensualidad que cubre hosting, dominio, respaldos, cambios y soporte. Valores brutos con boleta de honorarios." />}
        <div className="packs" data-forja>
          {PACKS.map((p) => {
            const s = splitPrice(p.setup), m = splitPrice(p.monthly);
            return (
              <article className={`pack${p.featured ? ' feat' : ''}`} key={p.name}>
                <i className="rim" aria-hidden="true"><i /></i>
                {p.featured && <span className="badge">Recomendado<i aria-hidden="true" /></span>}
                <div className="pk-c">
                  <H className="pn">{p.name}</H>
                  <small className="pl">Pago inicial{s.from && <> · {s.from}</>}</small>
                  <div className="pr"><Odo v={s.amount} /></div>
                  <div className="mo">+ <b>{m.from && <>{m.from} </>}<Odo v={m.amount} /></b> / mes</div>
                  <ul>{p.includes.map((x) => <li key={x}><Check /><span>{x}</span></li>)}</ul>
                  <Btn href={waLink(packMessage(p))} external variant={p.featured ? 'primary' : 'ghost'} icon={false}>Elegir pack</Btn>
                </div>
              </article>
            );
          })}
          <article className="pack">
            <i className="rim" aria-hidden="true"><i /></i>
            <div className="pk-c">
              <H className="pn">Software a medida</H>
              <small className="pl">Por alcance</small>
              <div className="pr">Cotización</div>
              <div className="mo">Escritorio, ERP, integraciones</div>
              <ul>{['Levantamiento de procesos', 'Prototipo antes de programar', 'Pago por hitos', 'Soporte mensual opcional'].map((x) => <li key={x}><Check /><span>{x}</span></li>)}</ul>
              <Btn href="/contacto" variant="ghost" icon={false}>Conversemos</Btn>
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
          <Btn href={waLink(FOUNDERS_MESSAGE)} external>Reservar cupo</Btn>
        </div>
        <p className="fine">Mensualidad sin permanencia con 30 días de aviso. Comisiones de pasarelas de pago y cuentas de desarrollador (Apple/Google) se cobran aparte.</p>
      </div>
    </section>
  );
}
