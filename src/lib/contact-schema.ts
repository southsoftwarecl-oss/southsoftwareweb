/**
 * Validación del formulario de contacto (compartida cliente/servidor).
 * El servidor SIEMPRE revalida; el cliente solo da feedback inmediato.
 */
import { z } from 'zod';
import { BUDGETS, PROJECT_TYPES } from '@/content/site';

// Sin JIT: zod no intenta `new Function` (lo bloquea nuestra CSP sin 'unsafe-eval').
z.config({ jitless: true });

const clean = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`)
    // elimina caracteres de control (excepto saltos de línea/tab en el mensaje)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));

export const contactSchema = z.object({
  nombre: clean(80).pipe(z.string().min(2, 'Ingresa tu nombre')),
  empresa: clean(120).optional().default(''),
  email: z.string().trim().max(160).pipe(z.email('Email no válido')),
  tipo: z.enum(PROJECT_TYPES, { message: 'Elige un tipo de proyecto' }),
  /** opcional (los formularios actuales no lo piden): habilita el botón de WhatsApp en el aviso */
  telefono: z.string().trim().max(30, 'Máximo 30 caracteres').regex(/^[+\d\s().-]*$/, 'Teléfono no válido').optional().default(''),
  presupuesto: z.union([z.enum(BUDGETS), z.literal('')]).optional().default(''),
  mensaje: clean(4000).optional().default(''),
  /** honeypot: debe venir vacío */
  website: z.string().max(0).optional().default(''),
  /** ms desde que se mostró el formulario (lo mide el navegador); el servidor exige CONTACT_MIN_MS */
  t: z.number().finite().nonnegative().max(1e10).optional().default(0),
  /** token de Cloudflare Turnstile (solo si está configurado) */
  turnstileToken: z.string().max(2048).optional().default(''),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
