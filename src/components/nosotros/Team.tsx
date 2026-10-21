/**
 * ACTO 4 — Las personas. Datos desde TEAM_READY (content/site.ts): solo personas con datos reales
 * (`ready`). Si no hay ninguna, la sección no se renderiza. photo null → monograma de cromo (iniciales).
 * Con una sola persona la tarjeta pasa a formato retrato + texto (`.team.solo`).
 * Con foto: duotono acero (filtro SVG estático) que se funde a color natural en hover/focus.
 */
import Image from 'next/image';
import { TEAM_READY } from '@/content/site';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

/** Monograma de cromo (sin foto): iniciales con degradé acero en el mismo marco 4:5. */
function Monogram({ name }: { name: string }) {
  return (
    <div className="tm-mono2" aria-hidden="true">
      <span className="tm-l">{initials(name)[0]}</span><span className="tm-l tm-l2">{initials(name)[1]}</span>
      <i className="tm-rule" />
    </div>
  );
}

export const hasTeam = TEAM_READY.length > 0;

export default function Team({ n = 3 }: { n?: number }) {
  if (!hasTeam) return null;
  return (
    <section className="sec team-sec" id="equipo" aria-labelledby="equipo-t">
      <svg className="fh-defs" width="0" height="0" aria-hidden="true" focusable="false">
        {/* duotono acero: escala de grises → #0A0A0B → #8FB4E3 → #EEF2F6 */}
        <filter id="tm-duo" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues=".039 .561 .933" />
            <feFuncG type="table" tableValues=".039 .706 .949" />
            <feFuncB type="table" tableValues=".043 .890 .965" />
          </feComponentTransfer>
        </filter>
        <linearGradient id="tm-mono-g" x1="0" y1="0" x2=".35" y2="1">
          <stop offset="0" stopColor="#EEF2F6" /><stop offset=".42" stopColor="#A4ADB8" /><stop offset=".55" stopColor="#5B636E" /><stop offset=".7" stopColor="#C9D1DA" /><stop offset="1" stopColor="#7F8894" />
        </linearGradient>
        <filter id="tm-liquid" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="wrap team-g">
        <div className="fx-head team-head">
          <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Equipo</div>
          <h2 id="equipo-t" className="fx-h" data-split="words">Las personas <span className="dim">detrás del código.</span></h2>
        </div>
        <ul className={`team${TEAM_READY.length === 1 ? ' solo' : TEAM_READY.length === 2 ? ' duo' : ''}`} role="list">
          {TEAM_READY.map((m, i) => (
            <li key={i} className="tm" style={{ ['--tilt' as string]: i % 2 ? '-3deg' : '3deg' }}>
              <article className="tm-card" tabIndex={0} aria-labelledby={`tm-n${i}`} aria-describedby={`tm-b${i}`}>
                <div className="tm-ph">
                  {m.photo ? (
                    <>
                      <Image className="tm-img tm-color" src={m.photo} alt={`Retrato de ${m.name}`} fill sizes="(max-width: 760px) 80vw, 25vw" />
                      <Image className="tm-img tm-duo" src={m.photo} alt="" aria-hidden fill sizes="(max-width: 760px) 80vw, 25vw" />
                    </>
                  ) : <Monogram name={m.name} />}
                </div>
                <h3 className="tm-name" id={`tm-n${i}`}>{m.name}</h3>
                <p className="tm-role">{m.role}</p>
                <p className="tm-bio" id={`tm-b${i}`}>{m.bio}
                  {m.links?.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="tm-link">{l.label} →</a>)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
