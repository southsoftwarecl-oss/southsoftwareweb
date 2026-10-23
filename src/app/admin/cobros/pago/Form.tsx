'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { recordPayment } from '../../actions';
import { METHODS, type OpenCharge } from '@/lib/admin/charges-shared';

const clp = (n: number) => '$' + n.toLocaleString('es-CL');

export default function PaymentForm({ charges, today, preselect }: { charges: OpenCharge[]; today: string; preselect?: string }) {
  const [s, action, pending] = useActionState(recordPayment, undefined);
  const f = s?.fields || {};
  const [sel, setSel] = useState(f.charge || preselect || charges[0]?.id || '');
  const c = charges.find((x) => x.id === sel);
  const balance = c ? c.amount - c.paid : 0;
  const [amount, setAmount] = useState(f.amount || (balance ? String(balance) : ''));
  const n = Number(amount.replace(/[^\d]/g, '')) || 0;
  if (s?.ok) return (
    <div className="adm-card form-card"><p className="adm-ok" role="status">{s.ok}</p>
      <div className="form-acts"><Link href="/admin/cobros" className="btn-a secondary">Ir a cobros</Link><Link href="/admin/cobros/pago" className="btn-a primary">Registrar otro pago</Link></div></div>
  );
  return (
    <form action={action} className="adm-card form-card" noValidate>
      <div aria-live="polite">{s?.error && <p className="adm-err" role="alert">{s.error}</p>}</div>
      <div className="form-grid">
        <div className="adm-field span2"><label htmlFor="charge">Cobro *</label>
          <select id="charge" name="charge" value={sel} onChange={(e) => { setSel(e.target.value); const x = charges.find((y) => y.id === e.target.value); setAmount(x ? String(x.amount - x.paid) : ''); }}>
            {charges.map((x) => <option key={x.id} value={x.id}>{x.client} · {x.concept} · saldo {clp(x.amount - x.paid)}{x.due ? ` · vence ${x.due.split('-').reverse().join('-')}` : ''}</option>)}
          </select></div>
        <div className="adm-field"><label htmlFor="amount">Monto pagado (CLP) *</label><input id="amount" name="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {c && n > 0 && n < balance && <span className="adm-note">Pago parcial: queda {clp(balance - n)} pendiente.</span>}
          {c && n > balance && <span className="adm-err" style={{ margin: 0 }}>Supera el saldo ({clp(balance)}).</span>}</div>
        <div className="adm-field"><label htmlFor="paid_on">Fecha del pago *</label><input id="paid_on" name="paid_on" type="date" defaultValue={f.paid_on || today} max={today} /></div>
        <div className="adm-field"><label htmlFor="method">Medio de pago *</label>
          <select id="method" name="method" defaultValue={f.method || 'transferencia'}>{METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
        <div className="adm-field"><label htmlFor="note">Nota</label><input id="note" name="note" maxLength={300} defaultValue={f.note} placeholder="N.º de operación, banco…" /></div>
      </div>
      <div className="form-acts"><Link href="/admin/cobros" className="btn-a ghost">Cancelar</Link><button type="submit" className="btn-a primary" disabled={pending || !c}>{pending ? 'Registrando…' : 'Confirmar pago'}</button></div>
    </form>
  );
}
