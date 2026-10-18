/**
 * Historia "Del commit al cliente" (story v3): una sola ventana que vive tres vidas
 * (código → interfaz → producto), scrubbed por scroll en desktop (≥1025px, pin sticky 180vh).
 * Bajo 1025px y con html.rm / html.capture se muestran tres tarjetas de paso (.cards).
 * La animación vive en lib/story-motion.ts. Todos los números del panel son DATOS DE EJEMPLO.
 */
type Tok = [cls: string, text: string, tok?: string];
/** pedidos.ts tokenizado (clases: k keyword, s string, f función, c comentario; tok = token fuente del morph) */
const CODE: Tok[][] = [
  [['c', '// pedidos.ts']],
  [['k', 'import'], ['', ' { db } '], ['k', 'from'], ['', ' '], ['s', '"@/lib/db"']],
  [],
  [['k', 'export async function'], ['', ' '], ['f', 'crearPedido', 'crearPedido'], ['', '('], ['', 'cliente', 'cliente'], ['', ', '], ['', 'items', 'items'], ['', ') {']],
  [['', '  '], ['k', 'const'], ['', ' '], ['', 'total', 'total'], ['', ' = items.reduce((s, i) => s + i.precio, 0)']],
  [['', '  '], ['k', 'const'], ['', ' pedido = '], ['k', 'await'], ['', ' db.pedidos.insert({ cliente, total })']],
  [['', '  '], ['k', 'await'], ['', ' '], ['f', 'notificar', 'notificar'], ['', '(cliente.whatsapp, '], ['s', '`Pedido #${pedido.id} listo`'], ['', ')']],
  [['', '  '], ['k', 'return'], ['', ' pedido']],
  [['', '}']],
];
/** líneas clave de la tarjeta móvil (las demás solo se muestran en reduced motion / captura) */
const KEY = new Set([3, 4, 6, 8]);
const Line = ({ l, tokens = true }: { l: Tok[]; tokens?: boolean }) => (
  <>{l.length ? l.map(([c, t, k], j) => <span key={j} className={c || undefined} data-tok={tokens ? k : undefined}>{t}</span>) : ' '}</>
);
/* Datos de ejemplo (ilustrativos, no son clientes ni métricas reales) */
const ITEMS: [string, number][] = [['Pernos 8 mm × 100', 12400], ['Taladro percutor', 54900], ['Guantes de trabajo', 6200]];
const TOTAL = ITEMS.reduce((s, [, p]) => s + p, 0);
const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const KPIS: [string, number, string][] = [['Pedidos', 128, ''], ['Ticket promedio', 18400, '$'], ['Clientes', 64, '']];
const ROWS: [string, string, string][] = [['#1042', 'Retiro', '$31.800'], ['#1041', 'Despacho', '$12.600'], ['#1040', 'Despacho', '$47.300'], ['#1039', 'Retiro', '$9.900']];
const SIDE = ['Inicio', 'Pedidos', 'Clientes', 'Productos', 'Ajustes'];
const CHART = 'M0,82 C30,74 50,78 80,58 S130,62 160,44 S220,38 250,24 S290,16 300,12';
const Blk = ({ className = '', children, ...r }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`blk ${className}`} {...r}><i className="bd" /><i className="bs" />{children}</div>
);
const Ico = ({ i }: { i: number }) => <svg viewBox="0 0 16 16" className="ico"><path d={['M2 8 8 3l6 5v5H2z', 'M3 3h10v10H3zM3 7h10', 'M8 7a3 3 0 1 0 0-.1M3 14c1-3 9-3 10 0', 'M3 5l5-3 5 3v6l-5 3-5-3z', 'M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M8 1v2M8 13v2M1 8h2M13 8h2'][i]} /></svg>;
const Chart = ({ id }: { id: string }) => (
  <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="chart-svg">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent-deep)" stopOpacity=".3" /><stop offset="1" stopColor="var(--accent-deep)" stopOpacity="0" /></linearGradient></defs>
    <path className="area" d={`${CHART} L300,100 L0,100 Z`} fill={`url(#${id})`} />
    <path className="line" pathLength={1} d={CHART} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="1" vectorEffect="non-scaling-stroke" />
  </svg>
);
const Kpi = ({ k }: { k: (typeof KPIS)[number] }) => (
  <Blk className="kpi"><span>{k[0]}</span><b data-kpi={k[1]} data-pre={k[2]}>{k[2] === '$' ? clp(k[1]) : k[1]}</b></Blk>
);

const STEPS = [
  ['01 — Código', 'Empieza con una línea de código.', 'Escribimos software limpio y tipado, pensado para que tu negocio crezca sin reescribirlo todo.'],
  ['02 — Interfaz', 'Se convierte en una interfaz clara.', 'Cada pantalla se diseña para que tu equipo y tus clientes la entiendan sin manual.'],
  ['03 — Producto', 'Y termina moviendo tu negocio.', 'Un producto en producción, medido y con soporte mensual. El panel muestra datos de ejemplo.'],
];
const LABELS = ['Código', 'Interfaz', 'Producto'];

export default function Story() {
  return (
    <section className="story" aria-label="Cómo construimos">
      <div className="pin"><div className="wrap"><div className="g12">
        <div className="copy">
          {STEPS.map(([m, h, p], i) => (
            <div className="step" key={i} data-step={i}><span className="mono">{m}</span><h3>{h}</h3><p>{p}</p></div>
          ))}
          <nav className="sprog" aria-label="Pasos de la historia">
            {LABELS.map((l, i) => (
              <button type="button" key={l} data-go={i} aria-current={i === 0 ? 'step' : undefined}><i><b /></i><span>{l}</span></button>
            ))}
          </nav>
        </div>

        {/* ===== desktop: una ventana, tres vidas ===== */}
        <div className="stage" aria-hidden="true">
          <div className="floor" />
          <div className="sdev">
            <i className="rim" />
            <div className="top"><i /><i /><i /><span>app.southsoftware.cl</span></div>
            <div className="body">
              <div className="layer code">
                <i className="hl" /><i className="caret" />
                {CODE.map((l, i) => <div className="row" key={i}><span className="gn">{i + 1}</span><span className="ln"><Line l={l} /></span></div>)}
                {/* Texto de ejemplo (ilustrativo, sin métricas reales) */}
                <div className="toast"><p>$ npm run build <em>✓</em> compilado en 1.2 s</p><p><em>✓</em> deploy listo</p></div>
              </div>
              <div className="app">
                <Blk className="side">{SIDE.map((s, i) => <div className="si" key={s}><Ico i={i} /><span className="w">{s}</span></div>)}</Blk>
                <Blk className="head"><span className="t-form w" data-dest="crearPedido">Nuevo pedido</span><span className="t-dash">Panel de pedidos <em className="live">●</em> En vivo</span></Blk>
                <div className="main">
                  <div className="form">
                    <div className="frow"><span className="lbl w" data-dest="cliente">Cliente</span><Blk className="inp"><span className="w">Ferretería Austral (ejemplo)</span></Blk></div>
                    <div className="frow"><span className="lbl w" data-dest="items">Ítems</span>
                      <div className="items">{ITEMS.map(([n, p]) => <Blk className="it" key={n}><span className="w">{n}</span><span className="w">{clp(p)}</span></Blk>)}</div></div>
                    <div className="frow tot"><span className="lbl w" data-dest="total">Total</span><b className="sum" data-sum={TOTAL}>{clp(TOTAL)}</b></div>
                    <button type="button" tabIndex={-1} className="cta" data-dest="notificar"><span className="w">Notificar por WhatsApp</span></button>
                  </div>
                  <div className="dash">
                    <div className="kpis">{KPIS.map((k) => <Kpi k={k} key={k[0]} />)}</div>
                    <Blk className="chart"><span>Pedidos / semana · datos de ejemplo</span><Chart id="sg-d" /></Blk>
                    <Blk className="table">
                      <div className="tr new"><i className="hi" /><span>#1043</span><span>Despacho</span><span>{clp(TOTAL)}</span></div>
                      {ROWS.slice(0, 3).map((r) => <div className="tr" key={r[0]}>{r.map((c) => <span key={c}>{c}</span>)}</div>)}
                    </Blk>
                  </div>
                </div>
              </div>
              <div className="pkt">Pedido #1043 · ejemplo</div>
              <div className="wa"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#25D366" /><path d="M5 11.5l.5-2A3.2 3.2 0 1 1 7 10.8z" fill="#0b0b0c" /></svg><span>Pedido #1043 listo <small>(ejemplo)</small></span></div>
              <div className="fly" />
            </div>
          </div>
        </div>

        {/* ===== móvil / reduced motion / captura: tres tarjetas de paso ===== */}
        <div className="cards" aria-hidden="true">
          <div className="card c-code" data-card={0}><div className="mtop"><i /><i /><i /><span>pedidos.ts</span></div>
            <div className="mcode">{CODE.map((l, i) => <div className={`row${KEY.has(i) ? ' key' : ' extra'}`} key={i}><span className="gn">{i + 1}</span><span className="ln"><Line l={l} tokens={false} /></span></div>)}</div></div>
          <div className="card c-ui" data-card={1}><div className="mtop"><i /><i /><i /><span>Nuevo pedido</span></div>
            <div className="mwin"><div className="mside">{SIDE.map((s, i) => <Ico i={i} key={s} />)}</div>
              <div className="mmain">
                <Blk className="m-b"><small>Cliente</small> Ferretería Austral (ejemplo)</Blk>
                {ITEMS.map(([n, p]) => <Blk className="m-b m-it" key={n}><span>{n}</span><span>{clp(p)}</span></Blk>)}
                <div className="m-tot"><small>Total</small><b data-sum={TOTAL}>{clp(TOTAL)}</b></div>
                <span className="cta m-cta">Notificar por WhatsApp</span>
              </div></div></div>
          <div className="card c-dash" data-card={2}><div className="mtop"><i /><i /><i /><span>Panel de pedidos <em className="live">●</em> En vivo</span></div>
            <div className="mwin"><div className="mside">{SIDE.map((s, i) => <Ico i={i} key={s} />)}</div>
              <div className="mmain">
                <div className="kpis">{KPIS.map((k) => <Kpi k={k} key={k[0]} />)}</div>
                <Blk className="chart"><span>Pedidos / semana · datos de ejemplo</span><Chart id="sg-m" /></Blk>
              </div></div></div>
        </div>
      </div></div></div>
    </section>
  );
}
