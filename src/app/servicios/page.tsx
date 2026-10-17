/** Servicios: detalle de las 6 especialidades + proceso (#proceso), stack (#stack) y franja de precios → /packs. */
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Process from '@/components/sections/Process';
import Stack from '@/components/sections/Stack';
import PacksTeaser from '@/components/sections/PacksTeaser';
import Final from '@/components/sections/Final';
import { AIcon, Btn, JsonLd } from '@/components/ui';
import { SERVICES } from '@/content/site';
import { pageMeta, servicesJsonLd } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Servicios',
  description: 'Software a medida, software de escritorio, sitios web, apps móviles, seguridad informática y ciencia de datos. Desarrollo en Puerto Montt para todo Chile.',
  path: '/servicios',
});

export default function Servicios() {
  return (
    <Page>
      <PageHero crumb={[{ href: '', label: 'Servicios' }]} eyebrow="Servicios" title={<>Seis disciplinas.<br /><span className="dim">Un solo equipo.</span></>}
        lead="Diseñamos, programamos, protegemos y medimos. Todo bajo el mismo techo, con un solo interlocutor que responde por el resultado." />
      <section className="sec" style={{ paddingTop: 40 }} aria-label="Detalle de servicios">
        <div className="wrap">
          <div className="srows">
            {SERVICES.map((s, i) => (
              <article className="srow spot" id={s.slug} key={s.slug} data-reveal>
                <div className="s-num"><span className="mono">0{i + 1}</span><AIcon name={s.icon} /></div>
                <div className="s-main"><h2>{s.title}</h2><p>{s.desc}</p><div className="tags">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div></div>
                <ul className="s-list">{s.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              </article>
            ))}
          </div>
          <div className="founders" data-reveal style={{ marginTop: 48 }}>
            <div><b>¿No sabes cuál necesitas?</b><p>En 30 minutos revisamos tu caso y te recomendamos el camino más simple.</p></div>
            <Btn href="/contacto">Agenda una reunión</Btn>
          </div>
        </div>
      </section>
      <Process n={1} />
      <Stack n={2} />
      {/* los packs completos viven en /packs; aquí la franja de precios */}
      <PacksTeaser n={3} />
      <Final n={4} />
      <JsonLd data={servicesJsonLd} />
    </Page>
  );
}
