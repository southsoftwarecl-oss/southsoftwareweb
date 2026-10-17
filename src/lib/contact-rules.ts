/**
 * Validación liviana para feedback inmediato en el navegador (sin zod, para no
 * cargar ~45 KB en el cliente). El servidor revalida SIEMPRE con zod
 * (lib/contact-schema.ts); mantener mensajes y reglas sincronizados.
 */
import { BUDGETS, PROJECT_TYPES } from '@/content/site';

export type ContactField = 'nombre' | 'empresa' | 'email' | 'tipo' | 'presupuesto' | 'mensaje';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(d: Record<string, string>) {
  const e: Partial<Record<ContactField, string>> = {};
  const nombre = (d.nombre || '').trim();
  if (nombre.length < 2) e.nombre = 'Ingresa tu nombre';
  else if (nombre.length > 80) e.nombre = 'Máximo 80 caracteres';
  if ((d.empresa || '').trim().length > 120) e.empresa = 'Máximo 120 caracteres';
  const email = (d.email || '').trim();
  if (!EMAIL.test(email) || email.length > 160) e.email = 'Email no válido';
  if (!(PROJECT_TYPES as readonly string[]).includes(d.tipo)) e.tipo = 'Elige un tipo de proyecto';
  if (d.presupuesto && !(BUDGETS as readonly string[]).includes(d.presupuesto)) e.presupuesto = 'Opción no válida';
  if ((d.mensaje || '').length > 4000) e.mensaje = 'Máximo 4000 caracteres';
  return e;
}
