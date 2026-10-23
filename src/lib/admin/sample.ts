/** Datos de ejemplo (fixture local) para el modo "Datos de ejemplo". Nunca se guardan ni se envían a la BD. Nombres ficticios. */
import type { Lead } from './leads';
const h = (hoursAgo: number, now: number) => new Date(now - hoursAgo * 3_600_000).toISOString();
export function sampleLeads(now: number): Lead[] {
  const L = (id: number, o: Partial<Lead>): Lead => ({ id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, channel: 'form_contacto', payload: {}, stage: 'nuevo', createdAt: h(2, now), ...o } as Lead);
  return [
    L(1, { name: 'Ferretería Ejemplo', email: 'contacto@ejemplo.cl', channel: 'form_contacto', message: 'Necesitamos un sitio con catálogo y WhatsApp.', payload: { empresa: 'Ferretería Ejemplo SpA', tipo: 'Sitio web' }, createdAt: h(3, now) }),
    L(2, { channel: 'arma_tu_pack', builder: { labels: ['Sitio pyme', 'Marketing Pro'] }, setup: 349990, monthly: 327233, createdAt: h(30, now) }),
    L(3, { channel: 'reservar_cupo', createdAt: h(50, now) }),
    L(4, { name: 'Clínica Demo', channel: 'elegir_pack', pack: 'Vitrina Digital', setup: 549990, monthly: 39990, stage: 'contactado', createdAt: h(80, now) }),
    L(5, { name: 'Taller Muestra', channel: 'form_contacto', stage: 'reunion', payload: { empresa: 'Taller Muestra' }, createdAt: h(120, now) }),
    L(6, { name: 'Estudio Prueba', channel: 'elegir_pack', pack: 'Blindaje Digital', setup: 0, monthly: 29990, stage: 'propuesta', createdAt: h(200, now) }),
    L(7, { name: 'Café Ficticio', channel: 'manual', stage: 'aceptado', setup: 449980, createdAt: h(300, now) }),
  ];
}
