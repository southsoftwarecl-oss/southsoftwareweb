/**
 * Contenido de /contacto (UI del brief). Los textos guía son SUGERENCIAS de
 * redacción, no datos. Los packs se referencian por nombre exacto de PACKS
 * (mismo mapeo que el configurador "Arma tu proyecto" de /servicios).
 */
import { PACKS, type IconName } from '@/content/site';
import type { BUDGETS, PROJECT_TYPES } from '@/content/site';

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type Budget = (typeof BUDGETS)[number];

/** Ícono AIcon por tipo de proyecto. */
export const TYPE_ICON: Record<ProjectType, IconName> = {
  'Sitio web': 'globe',
  'E-commerce': 'cart',
  'App móvil': 'phone',
  'Software a medida': 'code',
  'Software de escritorio': 'monitor',
  'Seguridad informática': 'shield',
  'Ciencia de datos': 'chart',
};

/** Pregunta guía del campo "Cuéntanos tu idea" según el tipo. */
export const TYPE_GUIDE: Record<ProjectType, string> = {
  'Sitio web': '¿A qué se dedica tu negocio y qué debería lograr tu sitio?',
  'E-commerce': '¿Qué vende tu tienda y cuántos productos tienes?',
  'App móvil': '¿Qué debería poder hacer la gente con tu app?',
  'Software a medida': '¿Qué proceso quieres ordenar? ¿Hoy lo llevas en planillas?',
  'Software de escritorio': '¿Dónde se usará y necesita funcionar sin internet?',
  'Seguridad informática': '¿Qué te preocupa hoy: tu web, tu correo o tus respaldos?',
  'Ciencia de datos': '¿Qué datos tienes hoy y qué decisión quieres tomar con ellos?',
};

/** Cómo se lee el tipo dentro de la frase "Necesito …" de la tarjeta del brief. */
export const TYPE_PHRASE: Record<ProjectType, string> = {
  'Sitio web': 'un sitio web',
  'E-commerce': 'una tienda online (e-commerce)',
  'App móvil': 'una app móvil',
  'Software a medida': 'software a medida',
  'Software de escritorio': 'software de escritorio',
  'Seguridad informática': 'seguridad informática',
  'Ciencia de datos': 'ciencia de datos',
};

/** Cómo se lee el presupuesto dentro de "con un presupuesto de …". */
export const budgetPhrase = (b: Budget) =>
  b === 'Aún no lo sé' ? 'con un presupuesto aún por definir' : `con un presupuesto de ${b.charAt(0).toLowerCase()}${b.slice(1)}`;

/**
 * Packs de referencia por tipo (nombres EXACTOS de PACKS).
 * Software a medida / escritorio → sin pack (cotización, sin precio).
 */
const TYPE_PACKS: Record<ProjectType, string[]> = {
  'Sitio web': ['Emprende', 'Pyme'],
  'E-commerce': ['E-commerce', 'Vitrina Digital'],
  'App móvil': ['App'],
  'Software a medida': [],
  'Software de escritorio': [],
  'Seguridad informática': ['Blindaje Digital'],
  'Ciencia de datos': ['Datos'],
};
export const packsFor = (t: ProjectType) =>
  TYPE_PACKS[t].map((n) => {
    const p = PACKS.find((x) => x.name === n);
    if (!p) throw new Error(`Pack inexistente en PACKS: ${n}`);
    return p;
  });
