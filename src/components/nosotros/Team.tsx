/**
 * ACTO 4 — Las personas. Datos desde TEAM (content/site.ts). Solo "Mathias Jara · Fundador" es real;
 * todo lo demás son marcadores [..] o siluetas de "Espacio reservado". photo null → silueta de cromo.
 * Con foto: duotono acero (filtro SVG estático) que se funde a color natural en hover/focus.
 */
import Image from 'next/image';
import { TEAM } from '@/content/site';

function Silhouette() {
  return (
    <svg className="tm-sil" viewBox="0 0 160 200" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
      <circle cx="80" cy="74" r="30" fill="url(#tm-sil-g)" />
      <path d="M22 200c2-44 26-70 58-70s56 26 58 70z" fill="url(#tm-sil-g)" />
    </svg>
  );
}

export default function Team({ n = 3 }: { n?: number }) {
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
        <linearGradient id="tm-sil-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EEF2F6" stopOpacity=".55" /><stop offset=".5" stopColor="#7F8894" stopOpacity=".35" /><stop offset="1" stopColor="#A4ADB8" stopOpacity=".12" />
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
          <p className="team-lead" data-reveal>Fotos, cargos y biografías se publicarán con la información oficial del equipo.</p>
        </div>
        <ul className="team" role="list">
          {TEAM.map((m, i) => (
            <li key={i} className={`tm${m.reserved ? ' tm-res' : ''}`} style={{ ['--tilt' as string]: i % 2 ? '-3deg' : '3deg' }}>
              <article className="tm-card" tabIndex={0} aria-labelledby={`tm-n${i}`} aria-describedby={`tm-b${i}`}>
                <div className="tm-ph">
                  {m.photo ? (
                    <>
                      <Image className="tm-img tm-color" src={m.photo} alt={`Retrato de ${m.name}`} fill sizes="(max-width: 760px) 80vw, 25vw" />
                      <Image className="tm-img tm-duo" src={m.photo} alt="" aria-hidden fill sizes="(max-width: 760px) 80vw, 25vw" />
                    </>
                  ) : <Silhouette />}
                  {m.reserved ? <span className="tm-pill mono">Espacio reservado</span> : !m.photo && <span className="tm-pill mono tm-ph-note">[Foto por completar]</span>}
                </div>
                <h3 className="tm-name" id={`tm-n${i}`}>{m.reserved ? <span className="ph">{m.name}</span> : m.name}</h3>
                <p className="tm-role">{m.reserved ? <span className="ph">{m.role}</span> : m.role}</p>
                <p className="tm-bio" id={`tm-b${i}`}><span className="ph">{m.bio}</span>
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
