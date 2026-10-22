/** Línea de tiempo: SOLO hitos con fecha real (historial del repositorio y anuncios publicados). Sin fecha → se omite. */
const MILESTONES = [
  { when: 'Octubre 2026', title: 'Lanzamos southsoftware.cl', desc: 'Precios publicados y casos reales desde el primer día.' },
  { when: 'Octubre 2026', title: 'Software & Marketing', desc: 'South Software suma un área de marketing: redes sociales, captación de leads y Meta Ads.' },
  { when: 'Hasta el 30 de noviembre de 2026', title: 'Clientes Fundadores', desc: '30 % de descuento en el pago inicial.' },
];
export default function Timeline({ n = 4 }: { n?: number }) {
  return (
    <section className="sec ptl-sec" id="hitos" aria-labelledby="hitos-t">
      <div className="wrap">
        <div className="eyebrow" data-reveal><b>({String(n).padStart(2, '0')})</b>Hitos</div>
        <h2 id="hitos-t" className="fx-h" data-split="words">Lo que hemos <span className="dim">construido.</span></h2>
        <ol className="ptl" data-stagger>
          {MILESTONES.map((m) => (
            <li key={m.title} className="ptl-i"><span className="ptl-w mono">{m.when}</span><h3>{m.title}</h3><p>{m.desc}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
