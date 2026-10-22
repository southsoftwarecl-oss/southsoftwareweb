/**
 * Correos transaccionales de South Software (sin dependencias).
 * - renderContactNotification(): aviso interno de una nueva solicitud (a contacto@southsoftware.cl).
 * - renderAutoReply(): confirmación breve al visitante ("Recibimos tu mensaje").
 *
 * Reglas para clientes de correo: layout con <table>, estilos inline, máx. 600 px, colores con
 * `bgcolor` + `style` (si el cliente descarta el CSS, el fondo oscuro se mantiene), sin fuentes web,
 * botones "bulletproof" (celda con fondo), logo como PNG alojado (@2x) en southsoftware.cl/email/logo.png.
 * TODO el texto del visitante pasa por esc(). El auto-reply no repite el mensaje del visitante
 * (solo un nombre de pila saneado y el tipo de proyecto, que es una opción cerrada) para que el
 * formulario no sirva para mandar texto arbitrario a terceros.
 */
import { BRAND, SITE_URL, WHATSAPP_NUMBER } from '@/content/site';

export type ContactEmailData = {
  nombre: string; email: string; empresa?: string; tipo: string; presupuesto?: string; mensaje?: string; telefono?: string;
};
export type EmailOpts = { logoSrc?: string; receivedAt?: Date; test?: boolean };
export type RenderedEmail = { subject: string; html: string; text: string };

const C = {
  bg: '#0A0A0B', card: '#111214', inset: '#0C0D0F', line: '#1F232A', line2: '#2A3038',
  fg: '#F2F4F7', body: '#C9CED6', muted: '#8A93A0', accent: '#8FB4E3', deep: '#244A7F', onAccent: '#0A0A0B',
};
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";
export const EMAIL_LOGO_URL = `${SITE_URL}/email/logo.png`;

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const escBr = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
const site = SITE_URL.replace(/^https?:\/\//, '');

/** Fecha en hora de Chile: "18 de octubre de 2026, 01:15 (hora de Chile)". */
export function chileDate(d = new Date()) {
  const f = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day} de ${p.month} de ${p.year}, ${p.hour}:${p.minute} (hora de Chile)`;
}

/** Teléfono del visitante → dígitos para wa.me (9XXXXXXXX chileno → 569XXXXXXXX). null si no sirve. */
export function waDigits(phone?: string) {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length === 9 && d.startsWith('9')) return `56${d}`;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/** Nombre de pila "seguro" para el saludo del auto-reply (sin URLs ni símbolos). */
export function firstName(nombre: string) {
  const w = oneLine(nombre).split(' ')[0] || '';
  return /^[\p{L}][\p{L}'’-]{0,29}$/u.test(w) ? w : '';
}

/* ---------- piezas ---------- */

function button(href: string, label: string, primary: boolean) {
  const bg = primary ? C.accent : C.card;
  const color = primary ? C.onAccent : C.fg;
  const border = primary ? C.accent : C.line2;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;display:inline-table;margin:0 8px 10px 0"><tr>`
    + `<td align="center" bgcolor="${bg}" style="background:${bg};border:1px solid ${border};border-radius:999px;mso-padding-alt:12px 22px">`
    + `<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:600;color:${color};text-decoration:none;border-radius:999px">${esc(label)}</a>`
    + `</td></tr></table>`;
}

function shell({ title, preheader, label, heading, intro, content, footerNote, logoSrc }: {
  title: string; preheader: string; label: string; heading: string; intro: string; content: string; footerNote: string; logoSrc: string;
}) {
  const ig = BRAND.instagram;
  const dot = ` <span style="color:${C.line2}">&nbsp;·&nbsp;</span> `;
  const flink = (href: string, t: string) => `<a href="${esc(href)}" target="_blank" style="color:${C.body};text-decoration:none;white-space:nowrap">${esc(t)}</a>`;
  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(title)}</title>
<style>
:root{color-scheme:dark light;supported-color-schemes:dark light}
body{margin:0!important;padding:0!important;width:100%!important;background:${C.bg}}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media (max-width:620px){
  .ss-pad{padding-left:22px!important;padding-right:22px!important}
  .ss-h1{font-size:23px!important;line-height:30px!important}
  .ss-row td{display:block!important;width:100%!important;box-sizing:border-box}
  .ss-row .ss-k{padding-bottom:2px!important;border-bottom:0!important}
  .ss-row .ss-v{padding-top:0!important;border-top:0!important}
  .ss-outer{padding:12px 8px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg}" bgcolor="${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg}">${esc(preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg}">
<tr><td align="center" class="ss-outer" style="padding:32px 16px">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
    <tr><td align="left" style="padding:4px 4px 22px">
      <a href="${esc(SITE_URL)}" target="_blank" style="text-decoration:none"><img src="${esc(logoSrc)}" width="216" height="68" alt="South Software" style="display:block;border:0;outline:none;width:216px;height:68px;color:${C.fg};font-family:${SANS};font-size:20px;font-weight:600"></a>
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:18px;overflow:hidden">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="3" bgcolor="${C.deep}" style="height:3px;line-height:3px;font-size:0;background:${C.deep};background-image:linear-gradient(90deg,${C.deep},${C.accent} 55%,${C.deep});border-radius:18px 18px 0 0">&nbsp;</td></tr>
        <tr><td class="ss-pad" style="padding:34px 40px 8px">
          <p style="margin:0 0 14px;font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${C.accent}">${esc(label)}</p>
          <h1 class="ss-h1" style="margin:0 0 12px;font-family:${SANS};font-size:27px;line-height:34px;font-weight:600;letter-spacing:-.3px;color:${C.fg}">${esc(heading)}</h1>
          <p style="margin:0;font-family:${SANS};font-size:15px;line-height:23px;color:${C.body}">${intro}</p>
        </td></tr>
        ${content}
      </table>
    </td></tr>
    <tr><td class="ss-pad" align="center" style="padding:26px 24px 8px;font-family:${SANS};font-size:13px;line-height:22px;color:${C.body}">
      ${flink(SITE_URL, site)}${dot}${flink(`mailto:${BRAND.email}`, BRAND.email)}${dot}${flink(`tel:${BRAND.phoneE164}`, BRAND.phone)}${dot}${flink(ig.url, ig.handle)}${dot}${flink(BRAND.facebook.url, 'Facebook')}
    </td></tr>
    <tr><td class="ss-pad" align="center" style="padding:6px 24px 0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted}">${footerNote}</td></tr>
    <tr><td align="center" style="padding:14px 24px 0;font-family:${MONO};font-size:10px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${C.muted}">South Software · Software para todo Chile</td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

/* ---------- aviso interno ---------- */

export function renderContactNotification(d: ContactEmailData, o: EmailOpts = {}): RenderedEmail {
  const nombre = oneLine(d.nombre);
  const empresa = oneLine(d.empresa || '');
  const presupuesto = oneLine(d.presupuesto || '');
  const mensaje = (d.mensaje || '').trim();
  const telefono = oneLine(d.telefono || '');
  const wa = waDigits(telefono);
  const when = chileDate(o.receivedAt);
  const tag = o.test ? '[Prueba] ' : '';
  const subject = `${tag}Nueva solicitud: ${oneLine(d.tipo)} — ${nombre}`.slice(0, 150);
  const replyHref = `mailto:${d.email}?subject=${encodeURIComponent('Re: tu solicitud a South Software')}`;
  const none = `<span style="color:${C.muted}">No indicado</span>`;

  const rows: [string, string][] = [
    ['Nombre', esc(nombre)],
    ['Email', `<a href="${esc(`mailto:${d.email}`)}" style="color:${C.accent};text-decoration:none">${esc(d.email)}</a>`],
    ...(telefono ? [['Teléfono', esc(telefono)] as [string, string]] : []),
    ['Empresa', empresa ? esc(empresa) : none],
    ['Servicio', `<span style="display:inline-block;padding:3px 10px;border:1px solid ${C.deep};border-radius:999px;color:${C.accent};font-size:13px;line-height:18px">${esc(oneLine(d.tipo))}</span>`],
    ['Presupuesto', presupuesto ? esc(presupuesto) : none],
  ];
  const rowHtml = rows.map(([k, v], i) => {
    const bt = i ? `border-top:1px solid ${C.line};` : '';
    return `<tr class="ss-row"><td class="ss-k" width="132" valign="top" style="${bt}padding:13px 12px 13px 0;font-family:${MONO};font-size:11px;line-height:20px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};white-space:nowrap">${esc(k)}</td>`
      + `<td class="ss-v" valign="top" style="${bt}padding:13px 0;font-family:${SANS};font-size:15px;line-height:21px;color:${C.fg};word-break:break-word">${v}</td></tr>`;
  }).join('');

  const content = `
        <tr><td class="ss-pad" style="padding:22px 40px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${rowHtml}</table>
        </td></tr>
        <tr><td class="ss-pad" style="padding:14px 40px 4px">
          <p style="margin:0 0 10px;font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted}">Mensaje</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td bgcolor="${C.inset}" style="background:${C.inset};border:1px solid ${C.line};border-left:3px solid ${C.deep};border-radius:12px;padding:16px 18px;font-family:${SANS};font-size:15px;line-height:24px;color:${mensaje ? C.body : C.muted}">${mensaje ? escBr(mensaje) : 'Sin mensaje adicional.'}</td>
          </tr></table>
        </td></tr>
        <tr><td class="ss-pad" style="padding:24px 40px 30px">
          ${button(replyHref, `Responder a ${nombre.split(' ')[0] || nombre}`, true)}${wa ? button(`https://wa.me/${wa}`, 'Responder por WhatsApp', false) : ''}
          <p style="margin:6px 0 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted}">También puedes responder este correo: va directo a ${esc(d.email)}.</p>
        </td></tr>`;

  const html = shell({
    title: subject, logoSrc: o.logoSrc || EMAIL_LOGO_URL,
    preheader: `${nombre}${empresa ? ` (${empresa})` : ''} · ${oneLine(d.tipo)}${presupuesto ? ` · ${presupuesto}` : ''}`,
    label: o.test ? 'Prueba · Formulario web' : 'Formulario web',
    heading: 'Nueva solicitud desde southsoftware.cl',
    intro: `Recibida el ${esc(when)}.${o.test ? ' <b style="color:' + C.accent + '">Este es un correo de prueba con datos de ejemplo.</b>' : ''}`,
    content,
    footerNote: `Enviado automáticamente por el formulario de ${esc(site)}.`,
  });

  const text = [
    o.test ? '[PRUEBA: datos de ejemplo]\n' : '',
    'NUEVA SOLICITUD DESDE SOUTHSOFTWARE.CL',
    `Recibida el ${when}`,
    '',
    `Nombre:      ${nombre}`,
    `Email:       ${d.email}`,
    ...(telefono ? [`Teléfono:    ${telefono}`] : []),
    `Empresa:     ${empresa || 'No indicado'}`,
    `Servicio:    ${oneLine(d.tipo)}`,
    `Presupuesto: ${presupuesto || 'No indicado'}`,
    '',
    'Mensaje:',
    mensaje || 'Sin mensaje adicional.',
    '',
    '—',
    `Responder: ${d.email} (o responde este correo)`,
    ...(wa ? [`WhatsApp: https://wa.me/${wa}`] : []),
    '',
    `${site} · ${BRAND.email} · ${BRAND.phone} · Instagram ${BRAND.instagram.handle} · Facebook ${BRAND.facebook.url}`,
  ].join('\n').replace(/^\n/, '');
  return { subject, html, text };
}

/* ---------- auto-reply al visitante ---------- */

export function renderAutoReply(d: Pick<ContactEmailData, 'nombre' | 'tipo'>, o: EmailOpts = {}): RenderedEmail {
  const name = firstName(d.nombre);
  const hola = name ? `Hola ${name},` : 'Hola,';
  const tipo = oneLine(d.tipo);
  const subject = `${o.test ? '[Prueba] ' : ''}Recibimos tu mensaje · South Software`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola South Software, les escribí por el formulario de la web')}`;
  const p = (t: string, extra = '') => `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.body}${extra}">${t}</p>`;

  const content = `
        <tr><td class="ss-pad" style="padding:20px 40px 4px">
          ${p(`${esc(hola)}`, `;color:${C.fg}`)}
          ${p(`Gracias por escribirnos. Recibimos tu solicitud sobre <b style="color:${C.fg};font-weight:600">${esc(tipo)}</b> y te respondemos dentro de 24 horas hábiles.`)}
          ${p('Si quieres sumar algo, como referencias, plazos o archivos, responde este correo y lo agregamos a tu solicitud.')}
        </td></tr>
        <tr><td class="ss-pad" style="padding:10px 40px 6px">
          ${button(waHref, 'Escríbenos por WhatsApp', true)}${button(`${SITE_URL}/packs`, 'Ver packs', false)}
        </td></tr>
        <tr><td class="ss-pad" style="padding:14px 40px 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.line};padding-top:18px;font-family:${SANS};font-size:14px;line-height:21px;color:${C.body}">
            <b style="color:${C.fg};font-weight:600">El equipo de South Software</b>
          </td></tr></table>
        </td></tr>`;

  const html = shell({
    title: subject, logoSrc: o.logoSrc || EMAIL_LOGO_URL,
    preheader: 'Gracias por escribirnos. Te respondemos dentro de 24 horas hábiles.',
    label: o.test ? 'Prueba · Confirmación' : 'Confirmación',
    heading: 'Recibimos tu mensaje',
    intro: 'Tu solicitud ya está con nosotros.',
    content,
    footerNote: `Recibes este correo porque enviaste el formulario de ${esc(site)}. Si no fuiste tú, puedes ignorarlo.`,
  });

  const text = [
    'RECIBIMOS TU MENSAJE',
    '',
    hola,
    '',
    `Gracias por escribirnos. Recibimos tu solicitud sobre ${tipo} y te respondemos dentro de 24 horas hábiles.`,
    'Si quieres sumar algo, como referencias, plazos o archivos, responde este correo y lo agregamos a tu solicitud.',
    '',
    `WhatsApp: ${waHref}`,
    `Packs: ${SITE_URL}/packs`,
    '',
    'El equipo de South Software',
    '',
    `${site} · ${BRAND.email} · ${BRAND.phone} · Instagram ${BRAND.instagram.handle} · Facebook ${BRAND.facebook.url}`,
    `Recibes este correo porque enviaste el formulario de ${site}. Si no fuiste tú, puedes ignorarlo.`,
  ].join('\n');
  return { subject, html, text };
}
