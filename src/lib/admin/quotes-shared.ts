/** Tipos de cotizaciones usables en cliente y servidor. */
export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'reemplazada';
export type QuoteVersion = { id: string; version: number; items: string[]; setup: number; monthly: number; notes: string | null; status: QuoteStatus; createdAt: string; decidedAt: string | null };
export type Quote = { id: string; requestId: string; title: string; createdAt: string; versions: QuoteVersion[] };
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = { borrador: 'Borrador', enviada: 'Enviada', aceptada: 'Aceptada', rechazada: 'Rechazada', reemplazada: 'Reemplazada' };
