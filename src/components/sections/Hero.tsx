/** Hero del home: partículas 3D + titular con reveal por palabra (preview 10, 1:1). */
import HeroCanvas from '../three/HeroCanvas';
import { Btn } from '../ui';
import { michromaFamily } from '@/lib/fonts';

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <HeroCanvas font={michromaFamily} />
      <div className="shade-b" />
      <div className="hx">
        <div className="wrap">
          <div className="g12" style={{ alignItems: 'end' }}>
            <div style={{ gridColumn: '1/8' }}>
              <div className="status" data-in=".1"><i />Agenda abierta · Clientes Fundadores</div>
              <h1 data-split="words">Cada detalle,<br />en su lugar.</h1>
            </div>
            <div style={{ gridColumn: '9/13' }}>
              <p className="sub" data-in=".55">Somos South Software: Software &amp; Marketing. Construimos software, apps y sitios web, y hacemos crecer tu marca con redes, leads y anuncios.</p>
              <div className="actions" data-in=".7">
                <Btn href="#contacto">Agenda una reunión</Btn>
                <Btn href="/proyectos" variant="ghost">Ver proyectos</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-meta">
        <div className="wrap">
          <span>South Software · Software &amp; Marketing</span>
          <span className="scroll">Desliza<i /></span>
          <span>Software · Web · Apps · Datos · Marketing</span>
        </div>
      </div>
    </section>
  );
}
