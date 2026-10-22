/**
 * Páginas por servicio (/servicios/[slug]). Solo servicios que el sitio YA ofrece (SERVICES y MARKETING_SERVICES).
 * Textos tomados del contenido real del sitio. `completar` = textos que Mathias debe escribir (no se muestran mientras sean null).
 * Sin clientes, cifras ni servicios inventados. Casos relacionados: solo proyectos reales de CASES.
 */
export type ServicePage = { slug: string; kind: 'software' | 'marketing'; title: string; h1: string; seoDesc: string; related: string[];
  /** COMPLETAR (Mathias): problema típico del cliente, en 1–2 frases. null = la sección no se muestra. */ problem: string | null;
  /** COMPLETAR (Mathias): preguntas frecuentes reales. Vacío = sin sección ni FAQPage schema. */ faq: { q: string; a: string }[] };

export const SERVICE_PAGES: ServicePage[] = [
  { slug: 'software-a-medida', kind: 'software', title: 'Desarrollo de software a medida para pymes en Chile', h1: 'Desarrollo de software a medida',
    seoDesc: 'Desarrollo de software a medida: sistemas de gestión, inventario, ventas y ERP livianos pensados para tu negocio. Agenda una reunión y cotiza tu sistema.',
    related: [], problem: null, faq: [] },
  { slug: 'software-de-escritorio', kind: 'software', title: 'Software de escritorio para Windows a medida', h1: 'Software de escritorio a medida',
    seoDesc: 'Software de escritorio para Windows: puntos de venta, control de stock y herramientas internas que funcionan sin internet. Cotiza tu proyecto con nosotros.',
    related: [], problem: null, faq: [] },
  { slug: 'sitios-web', kind: 'software', title: 'Desarrollo web y sitios rápidos a medida en Chile', h1: 'Desarrollo web de alto rendimiento',
    seoDesc: 'Desarrollo web a medida: sitios corporativos, catálogos y tiendas rápidas, con SEO local y panel editable. Mira nuestros proyectos y cotiza tu sitio web.',
    related: ['rg-motors-chile', 'salgado-automotriz', 'unidades-chile', 'frio-austral', 'suertu2s'], problem: null, faq: [] },
  { slug: 'apps-moviles', kind: 'software', title: 'Desarrollo de apps móviles iOS y Android', h1: 'Desarrollo de apps móviles',
    seoDesc: 'Desarrollo de apps móviles iOS, Android o PWA con login, pagos, notificaciones y publicación en las tiendas. Cuéntanos tu idea y cotiza tu app.',
    related: [], problem: null, faq: [] },
  { slug: 'seguridad-informatica', kind: 'software', title: 'Seguridad informática para pymes en Chile', h1: 'Seguridad informática para pymes',
    seoDesc: 'Seguridad informática para pymes: diagnóstico de web, correo y DNS, SPF, DKIM y DMARC, respaldos y monitoreo. Pide tu diagnóstico y protege tu negocio hoy.',
    related: [], problem: null, faq: [] },
  { slug: 'ciencia-de-datos', kind: 'software', title: 'Ciencia de datos y dashboards para pymes', h1: 'Ciencia de datos y dashboards',
    seoDesc: 'Ciencia de datos para pymes: dashboards en Power BI o Looker Studio que convierten tus planillas en decisiones de ventas y stock. Cotiza tu dashboard hoy.',
    related: [], problem: null, faq: [] },
  { slug: 'redes-sociales', kind: 'marketing', title: 'Gestión de redes sociales para pymes', h1: 'Gestión de redes sociales',
    seoDesc: 'Gestión de redes sociales para pymes: calendario, posts, historias y reels en Instagram, Facebook y TikTok, con reporte mensual. Mira los packs.',
    related: [], problem: null, faq: [] },
  { slug: 'captacion-de-leads', kind: 'marketing', title: 'Captación de leads con landings y WhatsApp', h1: 'Captación de leads',
    seoDesc: 'Captación de leads: campañas y landings conectadas a WhatsApp y formularios, con píxel de Meta y GA4 para medir cada contacto. Mira los packs y escríbenos.',
    related: [], problem: null, faq: [] },
  { slug: 'meta-ads', kind: 'marketing', title: 'Meta Ads: anuncios en Facebook e Instagram', h1: 'Meta Ads para Facebook e Instagram',
    seoDesc: 'Meta Ads para pymes: creamos y optimizamos tus anuncios en Facebook e Instagram, con segmentación y reportes. La pauta va aparte. Mira los packs.',
    related: [], problem: null, faq: [] },
  { slug: 'contenido', kind: 'marketing', title: 'Contenido para redes: posts, reels y textos', h1: 'Contenido para redes sociales',
    seoDesc: 'Contenido para redes sociales: posts, carruseles, reels y textos con la voz de tu marca y una línea gráfica coherente, listos para publicar. Ver packs.',
    related: [], problem: null, faq: [] },
];
