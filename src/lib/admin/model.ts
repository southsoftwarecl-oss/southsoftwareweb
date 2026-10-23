/** Modelo de dominio del panel (espejo TS de supabase/migrations/0001_admin_init.sql). */
export const STAGES = [
  { id: 'nuevo', label: 'Nuevo' }, { id: 'contactado', label: 'Contactado' }, { id: 'reunion', label: 'Reunión' },
  { id: 'propuesta', label: 'Propuesta' }, { id: 'aceptado', label: 'Aceptado' }, { id: 'activo', label: 'Activo' },
  { id: 'pausado', label: 'Pausado' }, { id: 'cancelado', label: 'Cancelado' },
] as const;
export const CHANNELS = [
  { id: 'form_contacto', label: 'Formulario de contacto' }, { id: 'elegir_pack', label: 'Elegir pack' },
  { id: 'arma_tu_pack', label: 'Arma tu pack' }, { id: 'arma_tu_proyecto', label: 'Arma tu proyecto' },
  { id: 'reservar_cupo', label: 'Reservar cupo Fundador' }, { id: 'manual', label: 'Ingreso manual' },
] as const;
export type StageId = (typeof STAGES)[number]['id'];
export type ChannelId = (typeof CHANNELS)[number]['id'];
export type SubscriptionStatus = 'pendiente_alta' | 'activo' | 'pausado' | 'cancelado';
export type ChargeStatus = 'programado' | 'por_cobrar' | 'enviado' | 'pagado' | 'parcial' | 'vencido' | 'anulado';

/** Días sin respuesta para considerar una propuesta "sin respuesta" (seguimiento en Inicio). Configurable aquí. */
export const PROPOSAL_STALE_DAYS = 5;
