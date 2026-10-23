/** Tipos y constantes de cobros usables en cliente y servidor (sin dependencias de servidor). */
export const METHODS = [
  { id: 'transferencia', label: 'Transferencia' }, { id: 'efectivo', label: 'Efectivo' }, { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' }, { id: 'link_pago', label: 'Link de pago' }, { id: 'otro', label: 'Otro' },
] as const;
export type MethodId = (typeof METHODS)[number]['id'];
export type OpenCharge = { id: string; client: string; concept: string; amount: number; paid: number; due: string | null; status: string };
