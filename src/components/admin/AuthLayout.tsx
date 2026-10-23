/** Pantallas de acceso: panel de marca sobrio (logo oficial + textura estática de partículas, eco del hero sin animación) + formulario. */
import { Monogram, Wordmark } from './Brand';

// Partículas estáticas y deterministas (PRNG con semilla fija): mismo resultado en servidor y cliente, sin JS en el navegador.
function particles() {
  let s = 20261023;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pts: { x: number; y: number; r: number; o: number }[] = [];
  for (let i = 0; i < 260; i++) {
    // Densidad mayor hacia abajo a la derecha (como un campo que se disipa)
    const x = Math.pow(rnd(), 0.6) * 400, y = Math.pow(rnd(), 0.7) * 600;
    pts.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +(0.6 + rnd() * 1.4).toFixed(2), o: +(0.15 + rnd() * 0.55).toFixed(2) });
  }
  return pts;
}
const PTS = particles();

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-brand" aria-hidden="true">
        <svg className="pattern" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          {PTS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" opacity={p.o} />)}
        </svg>
        <div style={{ position: 'relative', color: '#fff' }}><Wordmark height={30} /></div>
        <div style={{ position: 'relative' }}><h2>Solicitudes, clientes y cobros en un solo lugar.</h2><p>Panel interno del equipo. El acceso es solo por invitación.</p></div>
        <small style={{ position: 'relative' }}>© 2026 South Software</small>
      </div>
      <div className="auth-form"><div className="auth-box"><div className="auth-mlogo"><Monogram size={28} className="sb-mono" /><Wordmark height={16} /></div>{children}</div></div>
    </div>
  );
}
