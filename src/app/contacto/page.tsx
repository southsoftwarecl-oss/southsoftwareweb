/** Contacto: formulario + canales directos. */
import Page from '@/components/Page';
import Final from '@/components/sections/Final';
import { BRAND, WA_URL, WHATSAPP_IS_PLACEHOLDER } from '@/content/site';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Contacto',
  description: 'Agenda una reunión de 30 minutos sin costo con South Software. Software a medida, web, apps, seguridad y datos para todo Chile.',
  path: '/contacto',
});

export default function Contacto() {
  return (
    <Page>
      <div className="page-top" />
      <Final n={0} as="h1" title={<>Agenda una<br />reunión.</>} />
      <section className="sec" style={{ paddingTop: 0 }} aria-label="Canales directos">
        <div className="wrap">
          <div className="why channels" data-stagger>
            <div className="w"><span className="mono">Email</span><h2 className="h4"><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></h2><p>Respondemos dentro de 24 horas hábiles.</p></div>
            <div className="w"><span className="mono">WhatsApp</span><h2 className="h4"><a href={WA_URL} target="_blank" rel="noopener noreferrer">Escríbenos</a></h2><p>{WHATSAPP_IS_PLACEHOLDER ? <span className="ph">[Número por definir]</span> : 'Hablas directo con quien programa.'}</p></div>
            <div className="w"><span className="mono">Cobertura</span><h2 className="h4">Todo {BRAND.country}</h2><p>Reuniones por videollamada o en persona.</p></div>
          </div>
        </div>
      </section>
    </Page>
  );
}
