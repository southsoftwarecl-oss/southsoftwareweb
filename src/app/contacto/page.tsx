/**
 * Contacto: brief conversacional (tarjeta "Tu brief" en vivo + formulario con chips)
 * y canales directos con microinteracciones. Estilos en ./contacto.css.
 */
import Page from '@/components/Page';
import BriefStudio from '@/components/contacto/BriefStudio';
import CopyEmail from '@/components/contacto/CopyEmail';
import InstagramLink from '@/components/InstagramLink';
import LiquidPool from '@/components/contacto/LiquidPool';
import ChileClock from '@/components/contacto/ChileClock';
import { ArrowIcon } from '@/components/ui';
import { BRAND, WA_URL } from '@/content/site';
import { pageMeta } from '@/lib/seo';
import './contacto.css';

export const metadata = pageMeta({
  title: 'Contacto',
  description: 'Agenda una reunión de 30 minutos sin costo con South Software. Software a medida, web, apps, seguridad y datos para todo Chile.',
  path: '/contacto',
});

export default function Contacto() {
  const head = (
    <>
      <div className="eyebrow" data-reveal><b>(00)</b>Contacto</div>
      <h1 data-split="words" style={{ marginTop: 28 }}>Agenda una<br />reunión.</h1>
      <p data-reveal>30 minutos, sin costo. Te decimos con honestidad qué necesitas, cuánto cuesta y en cuánto tiempo.</p>
      <a className="orb" href={WA_URL} target="_blank" rel="noopener noreferrer"><span>Escríbenos<br />por WhatsApp</span><ArrowIcon /></a>
    </>
  );
  return (
    <Page>
      <div className="page-top" />
      <section className="final final-contact" id="contacto">
        <LiquidPool />
        <div className="wrap"><div className="g12">
          <BriefStudio head={head} />
        </div></div>
      </section>
      <section className="sec chan-sec" aria-label="Canales directos">
        <div className="wrap">
          <div className="why channels" data-stagger>
            <div className="w spot ch">
              <span className="mono">Email</span>
              <h2 className="h4"><a className="arw" href={`mailto:${BRAND.email}`}>{BRAND.email} <i aria-hidden="true">→</i></a></h2>
              <p>Respondemos dentro de 24 horas hábiles.</p>
              <div className="ch-acts"><CopyEmail email={BRAND.email} /><InstagramLink className="ch-btn" /></div>
            </div>
            <div className="w spot ch">
              <span className="mono">WhatsApp</span>
              <div className="ch-row">
                <h2 className="h4"><a className="arw" href={WA_URL} target="_blank" rel="noopener noreferrer">Escríbenos <i aria-hidden="true">→</i></a></h2>
                <a className="ch-btn" href={WA_URL} target="_blank" rel="noopener noreferrer">WhatsApp <i aria-hidden="true">→</i></a>
              </div>
              <p><a href={`tel:${BRAND.phoneE164}`}>{BRAND.phone}</a> · Hablas directo con quien programa.</p>
            </div>
            <div className="w spot ch ch-loc">
              <span className="mono">Cobertura</span>
              <h2 className="h4"><a className="arw" href="#contacto">Todo Chile <i aria-hidden="true">→</i></a></h2>
              <p>Remoto y presencial. Reuniones por videollamada o en persona.</p>
              <ChileClock />
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
