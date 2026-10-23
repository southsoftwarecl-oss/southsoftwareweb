'use client';
/** Cotizaciones de una solicitud: varias por solicitud, versionadas. Solo la versión vigente es editable/decidible; las anteriores, solo lectura. */
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Plus, Check, X, Send, Copy, Lock } from 'lucide-react';
import { addQuote, addQuoteVersion, decideQuote, getQuotes } from '@/app/admin/actions';
import { QUOTE_STATUS_LABEL, type Quote, type QuoteVersion } from '@/lib/admin/quotes-shared';

const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const TONE: Record<string, string> = { borrador: 'neutral', enviada: 'warn', aceptada: 'ok', rechazada: 'bad', reemplazada: 'neutral' };

function DraftForm({ initial, title, submit, onCancel, withTitle }: { initial?: QuoteVersion; title?: string; withTitle?: boolean; submit: (d: { title: string; items: string[]; setup: number; monthly: number; notes: string }) => void; onCancel: () => void }) {
  return (
    <form className="q-form" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const n = (k: string) => Number(String(f.get(k) || '').replace(/[^\d]/g, '')) || 0;
      submit({ title: String(f.get('title') || ''), items: String(f.get('items') || '').split('\n').map((x) => x.trim()).filter(Boolean), setup: n('setup'), monthly: n('monthly'), notes: String(f.get('notes') || '') }); }}>
      {withTitle && <div className="adm-field"><label htmlFor="q-title">Título</label><input id="q-title" name="title" defaultValue={title || 'Cotización'} maxLength={160} /></div>}
      <div className="adm-field"><label htmlFor="q-items">Ítems (uno por línea)</label><textarea id="q-items" name="items" rows={4} required defaultValue={initial?.items.join('\n')} placeholder={'Sitio pyme\nMarketing Pro'} /></div>
      <div className="form-grid">
        <div className="adm-field"><label htmlFor="q-setup">Pago inicial (CLP)</label><input id="q-setup" name="setup" inputMode="numeric" defaultValue={initial?.setup || ''} /></div>
        <div className="adm-field"><label htmlFor="q-monthly">Mensualidad (CLP)</label><input id="q-monthly" name="monthly" inputMode="numeric" defaultValue={initial?.monthly || ''} /></div>
      </div>
      <div className="adm-field"><label htmlFor="q-notes">Notas</label><input id="q-notes" name="notes" maxLength={2000} defaultValue={initial?.notes || ''} /></div>
      <div className="form-acts"><button type="button" className="btn-a ghost sm" onClick={onCancel}>Cancelar</button><button type="submit" className="btn-a primary sm">Guardar borrador</button></div>
    </form>
  );
}

export default function QuotesPanel({ requestId, sample, canWrite, onChange }: { requestId: string; sample: boolean; canWrite: boolean; onChange: (msg: string) => void }) {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<null | { kind: 'new' } | { kind: 'version'; q: Quote }>(null);
  const [pending, start] = useTransition();
  const load = useCallback(() => { if (sample) { setQuotes([]); return; } getQuotes(requestId).then((r) => { setQuotes(r.quotes); setErr(r.error || null); }); }, [requestId, sample]);
  useEffect(load, [load]); // eslint-disable-line react-hooks/set-state-in-effect -- carga de datos al abrir la pestaña
  const run = (p: Promise<{ ok: boolean; error?: string }>, msg: string) => start(async () => { const r = await p; if (!r.ok) { setErr(r.error || 'No se pudo.'); return; } setErr(null); setForm(null); onChange(msg); load(); });

  if (sample) return <p className="adm-note">Las cotizaciones no están disponibles con datos de ejemplo.</p>;
  if (!quotes) return <div className="sk" style={{ height: 120, borderRadius: 8 }} aria-busy="true" />;
  return (
    <div className="quotes" aria-busy={pending}>
      {err && <p className="adm-err" role="alert">{err}</p>}
      {!quotes.length && !form && <div className="adm-empty" style={{ padding: 20 }}><strong>Sin cotizaciones</strong><p>Para pasar a Propuesta crea una cotización. Para Aceptado, márcala como aceptada.</p></div>}
      {quotes.map((q) => {
        const cur = q.versions[q.versions.length - 1];
        const old = q.versions.slice(0, -1).reverse();
        const open = ['borrador', 'enviada'].includes(cur.status);
        return (
          <section key={q.id} className="q-card" aria-label={q.title}>
            <div className="q-h"><b>{q.title}</b><span className="q-v">v{cur.version}</span><span className={`chip ${TONE[cur.status]}`}>{QUOTE_STATUS_LABEL[cur.status]}</span></div>
            <ul className="q-items">{cur.items.map((i, k) => <li key={k}>{i}</li>)}</ul>
            <div className="q-amt adm-amt"><b>{clp(cur.setup)}</b> inicial{cur.monthly ? <> + <b>{clp(cur.monthly)}</b>/mes</> : null}</div>
            {cur.notes && <p className="adm-note">{cur.notes}</p>}
            {canWrite && (
              <div className="q-acts">
                {cur.status === 'borrador' && <button type="button" className="btn-a secondary sm" onClick={() => run(decideQuote(cur.id, 'enviada'), 'Cotización marcada como enviada.')}><Send size={14} aria-hidden="true" /> Marcar enviada</button>}
                {open && <button type="button" className="btn-a primary sm" onClick={() => run(decideQuote(cur.id, 'aceptada'), 'Cotización aceptada.')}><Check size={14} aria-hidden="true" /> Aceptar</button>}
                {open && <button type="button" className="btn-a ghost sm" onClick={() => run(decideQuote(cur.id, 'rechazada'), 'Cotización rechazada.')}><X size={14} aria-hidden="true" /> Rechazar</button>}
                {cur.status !== 'aceptada' && <button type="button" className="btn-a ghost sm" onClick={() => setForm({ kind: 'version', q })}><Copy size={14} aria-hidden="true" /> Nueva versión</button>}
              </div>
            )}
            {form?.kind === 'version' && form.q.id === q.id && <DraftForm initial={cur} submit={(d) => run(addQuoteVersion(q.id, d), `Versión ${cur.version + 1} creada.`)} onCancel={() => setForm(null)} />}
            {old.length > 0 && (
              <details className="q-old"><summary>Versiones anteriores ({old.length})</summary>
                {old.map((v) => <div key={v.id} className="q-oldv"><Lock size={12} aria-hidden="true" /> v{v.version} · {QUOTE_STATUS_LABEL[v.status]} · {clp(v.setup)}{v.monthly ? ` + ${clp(v.monthly)}/mes` : ''} · {v.items.join(', ')}</div>)}
              </details>
            )}
          </section>
        );
      })}
      {canWrite && (form?.kind === 'new'
        ? <DraftForm withTitle submit={(d) => run(addQuote(requestId, d.title, d), 'Cotización creada.')} onCancel={() => setForm(null)} />
        : <button type="button" className="btn-a secondary sm" onClick={() => setForm({ kind: 'new' })}><Plus size={14} aria-hidden="true" /> Nueva cotización</button>)}
    </div>
  );
}
