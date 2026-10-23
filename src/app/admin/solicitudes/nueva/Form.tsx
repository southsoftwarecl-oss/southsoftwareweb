'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { createManualRequest } from '../../actions';

export default function NewRequestForm({ packs }: { packs: { slug: string; name: string }[] }) {
  const [s, action, pending] = useActionState(createManualRequest, undefined);
  const f = s?.fields || {};
  return (
    <form action={action} className="adm-card form-card" noValidate>
      <div aria-live="polite">{s?.error && <p className="adm-err" role="alert">{s.error}</p>}</div>
      <div className="form-grid">
        <div className="adm-field"><label htmlFor="name">Nombre o empresa *</label><input id="name" name="name" required maxLength={120} defaultValue={f.name} autoFocus /></div>
        <div className="adm-field"><label htmlFor="company">Empresa</label><input id="company" name="company" maxLength={120} defaultValue={f.company} /></div>
        <div className="adm-field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" maxLength={160} defaultValue={f.email} /></div>
        <div className="adm-field"><label htmlFor="phone">Teléfono / WhatsApp</label><input id="phone" name="phone" type="tel" maxLength={40} defaultValue={f.phone} placeholder="+56 9 …" /></div>
        <div className="adm-field"><label htmlFor="source">¿Cómo llegó?</label>
          <select id="source" name="source" defaultValue={f.source || 'whatsapp'}>
            <option value="whatsapp">WhatsApp</option><option value="llamada">Llamada</option><option value="referido">Referido</option><option value="presencial">En persona</option><option value="redes">Redes sociales</option><option value="otro">Otro</option>
          </select></div>
        <div className="adm-field"><label htmlFor="pack">Pack de interés</label>
          <select id="pack" name="pack" defaultValue={f.pack || ''}><option value="">Aún no sabe</option>{packs.map((p) => <option key={p.slug} value={p.name}>{p.name}</option>)}</select></div>
        <div className="adm-field span2"><label htmlFor="message">Qué necesita</label><textarea id="message" name="message" rows={4} maxLength={2000} defaultValue={f.message} /></div>
      </div>
      <p className="adm-note">Se guarda en <b>Nuevo</b> con origen “Ingreso manual”. No se envía nada al cliente.</p>
      <div className="form-acts"><Link href="/admin/solicitudes" className="btn-a ghost">Cancelar</Link><button type="submit" className="btn-a primary" disabled={pending}>{pending ? 'Guardando…' : 'Crear solicitud'}</button></div>
    </form>
  );
}
