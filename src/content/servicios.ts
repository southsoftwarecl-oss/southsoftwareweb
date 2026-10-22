/**
 * Datos de interacción de /servicios (no es copy de marketing nuevo):
 * - opciones del configurador "Arma tu proyecto" y su mapeo a PACKS por nombre,
 * - descripciones sr-only de las mini-demos,
 * - relación servicio → tecnologías del STACK.
 * Textos de SERVICES / STEPS / STACK / PACKS: SIEMPRE se leen de content/site.ts.
 */
import { PACKS, SERVICES, STACK, WHATSAPP_NUMBER } from './site';

export const NEEDS = [
  { v: 'sitio-web', label: 'Sitio web' },
  { v: 'catalogo', label: 'Catálogo o automotora' },
  { v: 'tienda', label: 'Tienda online' },
  { v: 'app', label: 'App' },
  { v: 'seguridad', label: 'Seguridad' },
  { v: 'datos', label: 'Datos' },
  { v: 'a-medida', label: 'Sistema a medida o escritorio' },
] as const;
export const SIZES = [
  { v: 'solo', label: 'Solo yo' },
  { v: 'pyme', label: 'Pyme (2–20)' },
  { v: 'grande', label: 'Más grande' },
] as const;
export const WHENS = [
  { v: 'este-mes', label: 'Este mes', cta: 'Hablar por WhatsApp hoy' },
  { v: '1-3-meses', label: '1–3 meses', cta: 'Hablar por WhatsApp' },
  { v: 'explorando', label: 'Explorando', cta: 'Hablar por WhatsApp, sin compromiso' },
] as const;
export type Need = (typeof NEEDS)[number]['v'];
export type Size = (typeof SIZES)[number]['v'];
export type When = (typeof WHENS)[number]['v'];

export type PackCard = { name: string; setup: string | null; monthly: string | null; includes: string[]; quote: boolean };

/** Nombre del pack (debe existir en PACKS) según la necesidad y el tamaño. null → tarjeta "a medida · cotización". */
export function packNameFor(need: Need, size: Size | null): string | null {
  switch (need) {
    case 'sitio-web': return size === 'solo' ? 'Emprende' : 'Pyme';
    case 'catalogo': return 'Vitrina Digital';
    case 'tienda': return 'E-commerce';
    case 'app': return 'App';
    case 'seguridad': return 'Blindaje Digital';
    case 'datos': return 'Datos';
    case 'a-medida': return null;
  }
}

/** Tarjeta de resultado con valores EXACTOS de PACKS (o la de software a medida, sin precio). */
export function packFor(need: Need, size: Size | null): PackCard {
  const name = packNameFor(need, size);
  const p = name ? PACKS.find((x) => x.name === name) : undefined;
  if (p) return { name: p.name, setup: p.setup, monthly: p.monthly, includes: p.includes, quote: false };
  // Sin pack con precio: se cotiza. Los 4 includes son los del servicio "Software a medida" (SERVICES).
  const s = SERVICES.find((x) => x.slug === 'software-a-medida')!;
  return { name: 'Software a medida', setup: null, monthly: null, includes: s.includes, quote: true };
}

export function waHref(pack: string, answers: string[]) {
  const msg = `Hola, me interesa el pack ${pack}${answers.length ? ` (${answers.join(' · ')})` : ''}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/** Descripción para lectores de pantalla de cada mini-demo (la animación es aria-hidden). */
export const DEMO_DESC: Record<string, string> = {
  'software-a-medida': 'Demostración animada: una planilla Excel se conecta a un sistema y este genera un reporte; un dato viaja de un paso al siguiente.',
  'software-de-escritorio': 'Demostración: una aplicación de escritorio sin conexión guarda las ventas en cola y, al volver la conexión, las sube a la nube y muestra “Sincronizado”. Valores de ejemplo.',
  'sitios-web': 'Demostración: el mismo diseño de sitio (encabezado, portada y tres tarjetas) se adapta de escritorio a tablet y a celular.',
  'apps-moviles': 'Demostración: un teléfono muestra tres pantallas de una app: inicio de sesión, catálogo y una notificación push.',
  'seguridad-informatica': 'Simulación de un diagnóstico de seguridad de tuempresa.cl: revisa HTTPS, SPF, DKIM, DMARC, respaldos y cabeceras, y marca cada punto como correcto o con advertencia. Resultado de ejemplo.',
  'ciencia-de-datos': 'Demostración: una planilla de cinco filas se transforma en un dashboard con tres indicadores y un gráfico. Valores de ejemplo.',
};

/** Tecnologías del STACK relacionadas con cada servicio (a partir de sus tags; "Node" ↔ "Node.js"). */
const norm = (s: string) => s.toLowerCase().replace(/\.js$/, '');
export const STACK_FOR: Record<string, string[]> = Object.fromEntries(
  SERVICES.map((s) => [s.slug, STACK.filter(([name]) => s.tags.some((t) => norm(t) === norm(name))).map(([name]) => name)]),
);

/** Categorías del STACK en orden de aparición (columna "cat"). */
export const STACK_CATS: string[] = Array.from(new Set(STACK.map(([, cat]) => cat)));
