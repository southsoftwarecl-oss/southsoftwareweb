/** Nosotros: quiénes somos, principios y proceso. Equipo = marcadores. */
import Page from '@/components/Page';
import PageHero from '@/components/PageHero';
import Why from '@/components/sections/Why';
import Process from '@/components/sections/Process';
import Final from '@/components/sections/Final';
import { SecHead } from '@/components/ui';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Nosotros',
  description: 'South Software es un estudio chileno de desarrollo de software. Software a medida, web, apps, seguridad y datos con precio publicado y trato directo.',
  path: '/nosotros',
});

export default function Nosotros() {
  return (
    <Page>
      <PageHero crumb={[{ href: '', label: 'Nosotros' }]} eyebrow="Nosotros" title={<>Software hecho<br /><span className="dim">en el sur.</span></>}
        lead="Somos un estudio chileno de desarrollo. Construimos software, web y apps para empresas de todo el país que quieren crecer sin depender de nadie más que de sí mismas." />
      <section className="sec" style={{ paddingTop: 40 }} aria-label="Manifiesto">
        <div className="wrap">
          <div className="manifesto g12">
            <p className="m-big" data-reveal>Creemos que cualquier pyme, esté donde esté, merece la misma calidad técnica que una gran empresa. Por eso publicamos nuestros precios, dejamos todo a tu nombre y te atiende quien programa.</p>
            <div className="m-side" data-reveal>
              <div><small className="mono">Cobertura</small><span>Todo Chile · remoto y presencial</span></div>
              <div><small className="mono">Atención</small><span>Directa, con quien programa tu proyecto</span></div>
              <div><small className="mono">Especialidades</small><span>Software, escritorio, web, apps, seguridad y datos</span></div>
            </div>
          </div>
        </div>
      </section>
      <Why n={1} />
      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <SecHead n={2} eyebrow="Equipo" title={<>Las personas<br /><span className="dim">detrás del código.</span></>}
            lead="Fotos, cargos y biografías se publicarán con la información oficial del equipo." />
          <div className="testi" data-stagger>
            <figure className="tq"><span className="pill">Fundador</span><blockquote className="q">Mathias Jara</blockquote><figcaption className="who"><span className="av" /><span className="ph">[Cargo y biografía por completar]</span></figcaption></figure>
            {[0, 1].map((k) => (
              <figure className="tq" key={k}><span className="pill">Espacio reservado</span><blockquote className="q">Integrante del equipo</blockquote><figcaption className="who"><span className="av" /><span className="ph">[Nombre · Rol por completar]</span></figcaption></figure>
            ))}
          </div>
        </div>
      </section>
      <Process n={3} />
      <Final n={4} />
    </Page>
  );
}
