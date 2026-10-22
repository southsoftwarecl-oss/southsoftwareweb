'use client';
/** "Arma tu pack": pedido paso a paso (lógica y precios en content/arma.ts). */
import './marketing.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, DAYS, EXTRA_ITEMS, PLAN_ITEMS, SLOTS, clp, fmt, itemById, quote, quoteMessage, type CatId, type Item } from '@/content/arma';
import { ADS_NOTE, waLink } from '@/content/site';
import { Btn } from '../ui';

const price = (i: Item) => [i.setup ? `${i.from ? 'desde ' : ''}${clp(i.setup)} inicial` : '', i.monthly ? `${i.from ? 'desde ' : ''}${clp(i.monthly)}/mes` : ''].filter(Boolean).join(' + ');

function Card({ i, type, name, checked, onChange }: { i: Item; type: 'checkbox' | 'radio'; name: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="atp-card">
      <input type={type} name={name} value={i.id} aria-label={i.label} checked={checked} onChange={onChange} />
      <i className="atp-mk" aria-hidden="true" />
      <span className="atp-name">{i.label}</span><span className="atp-price">{price(i)}</span><span className="atp-note">{i.note}</span>
    </label>
  );
}

export default function ArmaTuPack() {
  const [cats, setCats] = useState<CatId[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [plan, setPlan] = useState('');
  const [step, setStep] = useState(0);
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState('');
  const head = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const chosen = CATEGORIES.filter((c) => cats.includes(c.id) && c.step);
  const steps = ['need', ...chosen.map((c) => c.id), 'summary'] as const;
  const cur = steps[Math.min(step, steps.length - 1)];
  const catOf = CATEGORIES.find((c) => c.id === cur);
  // ítems vigentes: solo de categorías marcadas
  const ids = useMemo(() => {
    const ok = new Set(CATEGORIES.filter((c) => cats.includes(c.id)).flatMap((c) => c.items));
    return [...picked.filter((x) => ok.has(x)), ...(plan && cats.includes('marketing') ? [plan] : [])];
  }, [cats, picked, plan]);
  const q = useMemo(() => quote(ids), [ids]);

  useEffect(() => { if (moved.current) head.current?.focus(); }, [step]);
  const go = (n: number) => { moved.current = true; setStep(n); };
  const toggle = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
  const reset = () => { setCats([]); setPicked([]); setPlan(''); setDay(''); setSlot(''); go(0); };
  const when = day && slot ? `${day}, ${slot} (hora de Chile)` : '';
  const canNext = cur === 'need' ? cats.length > 0 : true;
  const title = cur === 'need' ? '¿Qué necesitas?' : cur === 'summary' ? 'Tu resumen y reunión' : catOf!.title;

  return (
    <section className="sec atp-sec" id="arma-tu-pack" aria-labelledby="atp-t">
      <div className="wrap">
        <div className="mkp-head">
          <h2 className="h3" id="atp-t">Arma tu pack</h2>
          <p className="lead">Elige lo principal, suma complementos y ve el total al instante. Al combinar software con marketing mensual, la mensualidad baja 15 %.</p>
        </div>
        <div className="atp">
          <div className="atp-form">
            <div className="atp-prog">
              <p className="atp-step" aria-live="polite">Paso {step + 1} de {steps.length}</p>
              <ol className="atp-bar" aria-hidden="true">{steps.map((s, k) => <li key={s} className={k <= step ? 'on' : ''} />)}</ol>
            </div>
            <div className="atp-panel" key={cur}>
              <h3 className="atp-h" ref={head} tabIndex={-1}>{title}</h3>
              {cur === 'need' && (
                <fieldset>
                  <legend>Elige una o más opciones</legend>
                  <div className="atp-grid atp-big">
                    {CATEGORIES.filter((c) => c.step).map((c) => (
                      <label className="atp-card" key={c.id}>
                        <input type="checkbox" name="cat" value={c.id} aria-label={c.label} checked={cats.includes(c.id)} onChange={() => setCats(toggle(cats, c.id))} />
                        <i className="atp-mk" aria-hidden="true" />
                        <span className="atp-name">{c.label}</span><span className="atp-note">{c.note}</span>
                      </label>
                    ))}
                  </div>
                  <legend className="atp-sub">Extras opcionales</legend>
                  <div className="atp-grid">
                    {CATEGORIES.filter((c) => !c.step).map((c) => { const i = itemById(c.items[0]); return (
                      <Card key={c.id} i={i} type="checkbox" name="extra" checked={cats.includes(c.id) && picked.includes(i.id)}
                        onChange={() => { const on = cats.includes(c.id) && picked.includes(i.id); setCats(on ? cats.filter((x) => x !== c.id) : [...new Set([...cats, c.id])]); setPicked(on ? picked.filter((x) => x !== i.id) : [...new Set([...picked, i.id])]); }} />
                    ); })}
                  </div>
                </fieldset>
              )}
              {catOf && cur !== 'marketing' && (
                <fieldset>
                  <legend>{catOf.hint}</legend>
                  <div className="atp-grid">{catOf.items.map((id) => { const i = itemById(id); return <Card key={id} i={i} type="checkbox" name={cur} checked={picked.includes(id)} onChange={() => setPicked(toggle(picked, id))} />; })}</div>
                </fieldset>
              )}
              {cur === 'marketing' && (
                <fieldset>
                  <legend>Plan mensual (elige uno)</legend>
                  <div role="radiogroup" aria-label="Plan de marketing (elige uno)" className="atp-grid">
                    {PLAN_ITEMS.map((i) => <Card key={i.id} i={i} type="radio" name="plan" checked={plan === i.id} onChange={() => setPlan(i.id)} />)}
                  </div>
                  {plan && <button type="button" className="atp-link" onClick={() => setPlan('')}>Quitar plan</button>}
                  <legend className="atp-sub">Complementos</legend>
                  <div className="atp-grid">{EXTRA_ITEMS.map((i) => <Card key={i.id} i={i} type="checkbox" name="mkt-extra" checked={picked.includes(i.id)} onChange={() => setPicked(toggle(picked, i.id))} />)}</div>
                </fieldset>
              )}
              {cur === 'summary' && (
                <div className="atp-final">
                  {q.items.length === 0 ? <p className="atp-empty">Aún no eliges servicios. Vuelve atrás para sumar alguno.</p> : (
                    <table className="atp-detail">
                      <caption className="sr">Detalle por ítem</caption>
                      <thead><tr><th scope="col">Servicio</th><th scope="col">Pago inicial</th><th scope="col">Mensual</th></tr></thead>
                      <tbody>{q.items.map((i) => <tr key={i.id}><th scope="row">{i.label}</th><td>{i.setup ? fmt(i.setup, i.from) : '—'}</td><td>{i.monthly ? fmt(i.monthly, i.from) : '—'}</td></tr>)}</tbody>
                    </table>
                  )}
                  <p className="fine">Valor aproximado: lo confirmamos en la reunión. El onboarding y el pago inicial siempre se cobran. {ADS_NOTE}</p>
                  <fieldset className="atp-when">
                    <legend>¿Cuándo te acomoda la reunión? (lunes a sábado, 10:00 a 22:00, hora de Chile)</legend>
                    <label>Día<select value={day} onChange={(e) => setDay(e.target.value)}><option value="">Elige un día</option>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></label>
                    <label>Horario<select value={slot} onChange={(e) => setSlot(e.target.value)}><option value="">Elige un rango</option>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></label>
                  </fieldset>
                </div>
              )}
            </div>
            <div className="atp-nav">
              {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>Atrás</button>}
              {cur !== 'summary' && <button type="button" className="btn btn-primary" disabled={!canNext} aria-disabled={!canNext} onClick={() => canNext && go(step + 1)}>{canNext ? 'Siguiente' : 'Elige al menos una opción'}</button>}
              {(step > 0 || cats.length > 0) && <button type="button" className="atp-link" onClick={reset}>Reiniciar</button>}
            </div>
          </div>
          <aside className="atp-sum" aria-labelledby="atp-sum-t">
            <h3 id="atp-sum-t">Tu pack</h3>
            <div aria-live="polite" aria-atomic="true">
              {q.items.length === 0 ? <p className="atp-empty">Aún no eliges servicios.</p> : (
                <ul className="atp-list">{q.items.map((i) => <li key={i.id}>{i.label}</li>)}</ul>
              )}
              <dl className="atp-tot">
                <div><dt>Pago inicial</dt><dd data-total="setup" key={'s' + q.setup}>{fmt(q.setup, q.from)}</dd></div>
                <div><dt>Mensual</dt><dd data-total="monthly" key={'m' + q.monthly}>{fmt(q.monthly, q.from)}<small>/mes</small></dd></div>
              </dl>
              {q.combo && <p className="atp-combo">Descuento combo 15 % aplicado: mensual sin descuento {fmt(q.monthlyBase, q.from)}.</p>}
            </div>
            {cur === 'summary' && q.items.length > 0
              ? <><Btn href={waLink(quoteMessage(q, when))} external className="atp-cta" lead={{ channel: 'arma_tu_pack', items: q.items.map((i) => i.id), when: when || undefined }}>Agendar por WhatsApp</Btn>
                  <a className="atp-link atp-alt" href="/contacto">O usa el formulario de contacto</a></>
              : <p className="atp-off atp-cta">{q.items.length ? 'Sigue hasta el resumen para agendar' : 'Elige al menos un servicio'}</p>}
            <p className="fine">Valores brutos en CLP. “desde” = precio base según alcance. {ADS_NOTE}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
