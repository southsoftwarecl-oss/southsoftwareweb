/** Historia fijada: código → interfaz → producto (scroll-scrub en desktop). */
const CODE: React.ReactNode[] = [
  <span className="c" key="a">{'// pedidos.ts'}</span>,
  <><span className="k">import</span> {'{ db }'} <span className="k">from</span> <span className="s">&quot;@/lib/db&quot;</span></>,
  ' ',
  <><span className="k">export async function</span> <span className="f">crearPedido</span>(cliente, items) {'{'}</>,
  <>  <span className="k">const</span> total = items.reduce((s, i) =&gt; s + i.precio, 0)</>,
  <>  <span className="k">const</span> pedido = <span className="k">await</span> db.pedidos.insert({'{ cliente, total }'})</>,
  <>  <span className="k">await</span> notificar(cliente.whatsapp, <span className="s">{'`Pedido #${pedido.id} listo`'}</span>)</>,
  <>  <span className="k">return</span> pedido</>,
  '}',
];
const Blk = () => <div className="blk" />;

export default function Story() {
  return (
    <section className="story" aria-label="Cómo construimos">
      <div className="pin"><div className="wrap"><div className="g12">
        <div className="copy">
          <div className="step"><span className="mono">01 — Código</span><h3>Empieza con una línea de código.</h3><p>Escribimos software limpio y tipado, pensado para que tu negocio crezca sin reescribirlo todo.</p></div>
          <div className="step"><span className="mono">02 — Interfaz</span><h3>Se convierte en una interfaz clara.</h3><p>Cada pantalla se diseña para que tu equipo y tus clientes la entiendan sin manual.</p></div>
          <div className="step"><span className="mono">03 — Producto</span><h3>Y termina moviendo tu negocio.</h3><p>Un producto en producción, medido y con soporte mensual. El panel muestra datos de ejemplo.</p></div>
          <div className="progress" aria-hidden="true"><i><b /></i><i><b /></i><i><b /></i></div>
        </div>
        <div className="device" aria-hidden="true">
          <div className="top"><i /><i /><i /><span>app.southsoftware.cl</span></div>
          <div className="layer code">{CODE.map((l, i) => <span className="ln" key={i}>{l}</span>)}</div>
          <div className="layer"><div className="wire" style={{ opacity: 0 }}><div className="side" /><div className="main"><Blk /><Blk /><div className="row"><Blk /><Blk /><Blk /></div></div></div></div>
          <div className="layer prod" style={{ opacity: 0 }}><div className="wire"><div className="side"><i /><i /><i /><i /><i /></div><div className="main">
            <div className="blk" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>PANEL DE PEDIDOS<span style={{ color: 'var(--accent)' }}>● En vivo</span></div>
            <div className="blk chart">PEDIDOS / SEMANA · DATOS DE EJEMPLO<svg viewBox="0 0 300 100" preserveAspectRatio="none"><path pathLength={1} d="M0,80 C30,70 50,75 80,55 S130,60 160,40 S220,35 250,20 S290,15 300,10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="1" /></svg></div>
            <div className="row"><div className="blk">PEDIDOS<b>—</b></div><div className="blk">TICKET PROMEDIO<b>—</b></div><div className="blk">CLIENTES<b>—</b></div></div>
          </div></div></div>
        </div>
      </div></div></div>
    </section>
  );
}
