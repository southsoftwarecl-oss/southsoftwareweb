'use client';
/** "Arma tu pack": calculadora con totales en vivo (lógica y precios en content/arma.ts). */
import { useMemo, useState } from 'react';
import { COMBO_RULE, EXTRA_ITEMS, PLAN_ITEMS, SOFTWARE_ITEMS, clp, fmt, quote, quoteMessage, type Item } from '@/content/arma';
import { ADS_NOTE, waLink } from '@/content/site';
import { Btn } from '../ui';

const price = (i: Item) => [i.setup ? `${i.from ? 'desde ' : ''}${clp(i.setup)}` : '', i.monthly ? `${i.from ? 'desde ' : ''}${clp(i.monthly)}/mes` : ''].filter(Boolean).join(' + ');

export default function ArmaTuPack() {
  const [sw, setSw] = useState<string[]>([]);
  const [plan, setPlan] = useState<string>('');
  const [extra, setExtra] = useState<string[]>([]);
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const q = useMemo(() => quote([...sw, ...(plan ? [plan] : []), ...extra]), [sw, plan, extra]);
  const empty = q.items.length === 0;

  const Check = ({ i, list, set }: { i: Item; list: string[]; set: (v: string[]) => void }) => (
    <label className="atp-opt">
      <input type="checkbox" name={i.id} value={i.id} checked={list.includes(i.id)} onChange={() => toggle(list, set, i.id)} />
      <span className="atp-l">{i.label}</span><span className="atp-p mono">{price(i)}</span>
    </label>
  );

  return (
    <section className="sec atp-sec" id="arma-tu-pack" aria-labelledby="atp-t">
      <div className="wrap">
        <div className="mkp-head">
          <h2 className="h3" id="atp-t">Arma tu pack</h2>
          <p className="lead">Elige los servicios que necesitas y ve el total al instante. {COMBO_RULE}</p>
        </div>
        <div className="atp">
          <div className="atp-form">
            <fieldset>
              <legend>Software</legend>
              {SOFTWARE_ITEMS.map((i) => <Check key={i.id} i={i} list={sw} set={setSw} />)}
            </fieldset>
            <fieldset>
              <legend>Marketing</legend>
              <div role="radiogroup" aria-label="Plan de marketing (elige uno)" className="atp-plans">
                <label className="atp-opt"><input type="radio" name="plan" value="" checked={plan === ''} onChange={() => setPlan('')} /><span className="atp-l">Sin plan de marketing</span><span className="atp-p" /></label>
                {PLAN_ITEMS.map((i) => (
                  <label className="atp-opt" key={i.id}>
                    <input type="radio" name="plan" value={i.id} checked={plan === i.id} onChange={() => setPlan(i.id)} />
                    <span className="atp-l">{i.label}</span><span className="atp-p mono">{price(i)}</span>
                  </label>
                ))}
              </div>
              {EXTRA_ITEMS.map((i) => <Check key={i.id} i={i} list={extra} set={setExtra} />)}
            </fieldset>
          </div>
          <aside className="atp-sum" aria-labelledby="atp-sum-t">
            <h3 id="atp-sum-t">Tu pack</h3>
            <div aria-live="polite" aria-atomic="true">
              {empty ? <p className="atp-empty">Aún no eliges servicios.</p> : (
                <ul className="atp-list">{q.items.map((i) => <li key={i.id}>{i.label}{i.id === 'onboarding' && q.onboardingFree ? ' · incluido' : ''}</li>)}</ul>
              )}
              <dl className="atp-tot">
                <div><dt>Pago inicial</dt><dd data-total="setup">{fmt(q.setup, q.from)}</dd></div>
                <div><dt>Mensual</dt><dd data-total="monthly">{fmt(q.monthly, q.from)}<small>/mes</small></dd></div>
              </dl>
              {q.combo && <p className="atp-combo">Descuento combo aplicado: mensual sin descuento {fmt(q.monthlyBase, q.from)}.</p>}
            </div>
            {empty
              ? <p className="atp-cta atp-off" aria-disabled="true">Elige al menos un servicio</p>
              : <Btn href={waLink(quoteMessage(q))} external className="atp-cta">Enviar por WhatsApp</Btn>}
            <p className="fine">Valores brutos en CLP. “desde” = precio base según alcance. {ADS_NOTE}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
