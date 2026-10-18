/** 404 creativo: las partículas forman "404" y se apartan del mouse. */
import Page from '@/components/Page';
import HeroCanvas from '@/components/three/HeroCanvas';
import { Btn } from '@/components/ui';
import { michromaFamily } from '@/lib/fonts';

export const metadata = { title: 'Página no encontrada', robots: { index: false } };

const LINES = [{ text: '404', size: 300, y: 200 }];

export default function NotFound() {
  return (
    <Page>
      <section className="hero nf" data-cursor-hide>
        <HeroCanvas font={michromaFamily} lines={LINES} />
        <div className="shade-b" />
        <div className="hx">
          <div className="wrap">
            <div className="g12" style={{ alignItems: 'end' }}>
              <div style={{ gridColumn: '1/8' }}>
                <div className="status nf-status" data-in=".1"><i />Error 404 · Ruta no encontrada</div>
                <h1 data-split="words">Esta página<br />se perdió en el sur.</h1>
              </div>
              <div style={{ gridColumn: '9/13' }}>
                <p className="sub" data-in=".55">El enlace no existe o cambió de lugar. Mueve el mouse para ordenar las partículas, o vuelve a terreno conocido.</p>
                <div className="actions" data-in=".7">
                  <Btn href="/">Volver al inicio</Btn>
                  <Btn href="/proyectos" variant="ghost">Ver proyectos</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
