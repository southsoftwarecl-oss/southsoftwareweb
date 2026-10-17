/** Hero del home: partículas 3D + titular con reveal por palabra (preview 10, 1:1). */
import HeroCanvas from '../three/HeroCanvas';
import { Btn } from '../ui';
import { michromaFamily } from '@/lib/fonts';

export default function Hero() {
  return (
    <section className="hero" id="hero" data-cursor-lens>
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
              <p className="sub" data-in=".55">Software a medida, apps y sitios web construidos con obsesión por el detalle desde Puerto Montt.</p>
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
          <span>41°28′S — 72°56′O · Puerto Montt</span>
          <span className="scroll">Desliza<i /></span>
          <span>Software · Web · Apps · Seguridad · Datos</span>
        </div>
      </div>
    </section>
  );
}
