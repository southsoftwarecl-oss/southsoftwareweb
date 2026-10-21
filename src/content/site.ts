/**
 * ============================================================
 *  CONTENIDO DEL SITIO — edita aquí textos, precios y proyectos
 * ============================================================
 * Todo el copy vive en este archivo para que no tengas que tocar
 * componentes. Los valores marcados con `PLACEHOLDER` o entre
 * corchetes [ ] son marcadores visibles que DEBEN reemplazarse con
 * datos reales antes de publicar. No inventar cifras ni testimonios.
 */

/** URL pública del sitio (canonical, sitemap, OG). Se puede sobrescribir con NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://southsoftware.cl').replace(/\/$/, '');

export const BRAND = {
  name: 'South Software',
  tagline: 'Software & Marketing',
  description:
    'Somos South Software: Software & Marketing. Desarrollamos software a medida, apps y sitios web, y gestionamos redes sociales, captación de leads, Meta Ads y contenido para pymes.',
  email: 'contacto@southsoftware.cl',
  /** Teléfono / WhatsApp: `phone` para mostrar, `phoneE164` para tel: y JSON-LD. */
  phone: '+56 9 6471 0361',
  phoneE164: '+56964710361',
  country: 'Chile',
  /** Única red social oficial (también en JSON-LD sameAs). No agregar perfiles que no existan. */
  instagram: { url: 'https://www.instagram.com/southsoftwarecl', handle: '@southsoftwarecl' },
};

/** Número de WhatsApp (formato internacional sin +). */
export const WHATSAPP_NUMBER = '56964710361';
export const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola South Software, quiero cotizar un proyecto')}`;

/**
 * Enlace de WhatsApp con mensaje precargado. Parte de WA_URL: si ya trae `text=` se REEMPLAZA (dos `text` harían que
 * WhatsApp muestre el genérico); cualquier otro parámetro se conserva y el texto se agrega con `&`.
 * El texto va con encodeURIComponent (espacios como %20).
 */
export function waLink(text: string) {
  const [base, query = ''] = WA_URL.split('?');
  const keep = query.split('&').filter((kv) => kv && !/^text=/.test(kv));
  return `${base}?${[...keep, `text=${encodeURIComponent(text)}`].join('&')}`;
}
/** Mensaje de "Elegir pack" (valores EXACTOS de PACKS). */
export const packMessage = (p: { name: string; setup: string; monthly: string }) =>
  `Hola, me interesa el pack ${p.name} (pago inicial ${p.setup} + ${p.monthly}/mes). ¿Conversamos?`;
export const FOUNDERS_MESSAGE = 'Quiero reservar un cupo de Cliente Fundador';

/** Navegación principal (mismo pill del preview). */
export const NAV = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/packs', label: 'Packs' },
  { href: '/contacto', label: 'Contacto' },
];

export type IconName = 'code' | 'monitor' | 'globe' | 'phone' | 'shield' | 'chart' | 'cart';

export const SERVICES: {
  slug: string; icon: IconName; title: string; short: string; desc: string; tags: string[]; includes: string[];
}[] = [
  { slug: 'software-a-medida', short: 'Software a medida', icon: 'code', title: 'Software integral a medida',
    desc: 'Sistemas de gestión, inventario, ventas y ERP livianos diseñados alrededor de cómo trabaja tu negocio, no al revés.',
    tags: ['Next.js', 'Node', 'PostgreSQL'],
    includes: ['Levantamiento de procesos con tu equipo', 'Prototipo navegable antes de programar', 'Roles, permisos y respaldos', 'Integración con planillas y sistemas existentes'] },
  { slug: 'software-de-escritorio', short: 'Escritorio', icon: 'monitor', title: 'Software de escritorio',
    desc: 'Aplicaciones para Windows rápidas y estables: puntos de venta, control de stock y herramientas internas que funcionan incluso sin internet.',
    tags: ['Electron', 'Tauri', 'SQLite'],
    includes: ['Funcionamiento sin conexión', 'Sincronización con la nube cuando hay red', 'Instalador y actualizaciones automáticas', 'Impresión de boletas y etiquetas'] },
  { slug: 'sitios-web', short: 'Sitios web', icon: 'globe', title: 'Sitios web de alto rendimiento',
    desc: 'Webs corporativas, catálogos y tiendas que cargan rápido, se ven impecables en el celular y convierten visitas en conversaciones.',
    tags: ['SEO local', 'Core Web Vitals', 'CMS'],
    includes: ['Diseño a medida, sin plantillas', 'SEO local y Google Business', 'Panel para editar contenidos', 'Analítica y formularios conectados'] },
  { slug: 'apps-moviles', short: 'Apps móviles', icon: 'phone', title: 'Apps móviles',
    desc: 'Apps iOS y Android o PWA con login, notificaciones y backend en la nube, publicadas en las tiendas.',
    tags: ['React Native', 'Flutter', 'PWA'],
    includes: ['MVP enfocado en lo esencial', 'Login, pagos y notificaciones push', 'Publicación en App Store y Google Play', 'Pago por hitos 30/30/30/10'] },
  { slug: 'seguridad-informatica', short: 'Seguridad', icon: 'shield', title: 'Seguridad informática',
    desc: 'Diagnóstico de tu web y correo, SPF/DKIM/DMARC, respaldos y monitoreo continuo. Preparado para la Ley 21.719.',
    tags: ['Diagnóstico', 'Hardening', 'Monitoreo'],
    includes: ['Revisión de web, correo y DNS', 'Informe ejecutivo con plan de remediación', 'Respaldos verificados', 'Alertas por WhatsApp'] },
  { slug: 'ciencia-de-datos', short: 'Datos', icon: 'chart', title: 'Ciencia de datos',
    desc: 'Dashboards que convierten tus planillas en decisiones: ventas, stock y operación en una sola pantalla.',
    tags: ['Power BI', 'Looker Studio', 'Python'],
    includes: ['Conexión a tus fuentes de datos', 'Indicadores clave definidos contigo', 'Actualización automática', 'Capacitación al equipo'] },
];

/**
 * MARKETING DIGITAL — liderado por Ramón Ojeda (ver TEAM). Servicios sin cifras ni resultados inventados.
 */
export const MARKETING_LEAD = 'Ramón Ojeda';
export const MARKETING_SERVICES: { slug: string; title: string; desc: string; includes: string[] }[] = [
  { slug: 'redes-sociales', title: 'Gestión de redes sociales',
    desc: 'Planificamos, diseñamos y publicamos en Instagram, Facebook y TikTok, y respondemos a tu comunidad.',
    includes: ['Calendario mensual de publicaciones', 'Posts, historias y reels', 'Respuesta a comentarios y mensajes', 'Reporte mensual'] },
  { slug: 'captacion-de-leads', title: 'Captación de leads',
    desc: 'Campañas y landings pensadas para que los interesados te escriban por WhatsApp o formulario.',
    includes: ['Landing de captación', 'Formularios y WhatsApp conectados', 'Píxel de Meta y GA4', 'Seguimiento de leads'] },
  { slug: 'meta-ads', title: 'Meta Ads (Facebook e Instagram)',
    desc: 'Creamos y optimizamos tus anuncios en Facebook e Instagram. La pauta (lo que se paga a Meta) va siempre aparte.',
    includes: ['Configuración de campañas', 'Segmentación y públicos', 'Optimización continua', 'Reporte de resultados'] },
  { slug: 'contenido', title: 'Contenido',
    desc: 'Piezas gráficas, reels y textos con la voz de tu marca, listos para publicar.',
    includes: ['Diseño de posts y carruseles', 'Edición de reels', 'Textos y llamados a la acción', 'Línea gráfica coherente'] },
];

/** Packs: precios exactos (CLP, valores brutos). */
/** Packs que se muestran en la franja de precios del home (por nombre, deben existir en PACKS). */
export const HOME_PACKS = ['Emprende', 'Pyme', 'E-commerce'] as const;

export const PACKS: { name: string; setup: string; monthly: string; featured?: boolean; includes: string[] }[] = [
  { name: 'Emprende', setup: '$149.990', monthly: '$19.990', includes: ['Landing de 1 página adaptada a celular', 'Botón de WhatsApp, mapa y formulario', 'Dominio .cl a tu nombre', 'Hosting, SSL y soporte por WhatsApp'] },
  { name: 'Pyme', setup: '$349.990', monthly: '$34.990', featured: true, includes: ['Sitio de hasta 6 secciones', 'SEO local para tu ciudad', '2 correos corporativos', 'Respaldo semanal y reporte mensual'] },
  { name: 'Automotora / Catálogo', setup: '$549.990', monthly: '$49.990', includes: ['Catálogo autoadministrable', 'Ficha por vehículo o producto con filtros', 'WhatsApp con el producto precargado', 'Respaldo diario y soporte en 24 h'] },
  { name: 'E-commerce', setup: '$699.990', monthly: '$59.990', includes: ['Tienda con Webpay o Mercado Pago', 'Carga inicial de hasta 50 productos', 'Despacho, retiro y correos automáticos', 'Parches de seguridad y monitoreo'] },
  { name: 'App', setup: 'desde $1.490.000', monthly: 'desde $99.990', includes: ['MVP iOS/Android o PWA', 'Login, backend y notificaciones push', 'Publicación en las tiendas', 'Pago por hitos 30/30/30/10'] },
  { name: 'Seguridad', setup: '$249.990', monthly: '$29.990', includes: ['Diagnóstico de web y correo', 'Informe ejecutivo y plan de remediación', 'Monitoreo y alertas por WhatsApp', 'Escaneo mensual de vulnerabilidades'] },
  { name: 'Datos', setup: 'desde $390.000', monthly: 'desde $39.990', includes: ['Dashboard con 1–2 fuentes de datos', 'Hasta 8 indicadores clave', 'Actualización automática', 'Capacitación incluida'] },
];

/**
 * Packs combinados (web/app + marketing) y solo marketing: valores EXACTOS de precios/packs-marketing.md.
 * `launch` = precio de lanzamiento mensual por los 3 primeros meses. La pauta publicitaria va siempre aparte.
 */
export type MktPack = { name: string; tag?: string; setup: string; monthly: string; launch: string | null; featured?: boolean; includes: string[]; ideal?: string };
export const COMBO_PACKS: MktPack[] = [
  { name: 'Despega', tag: 'Emprende + Marketing Básico', setup: '$149.990', monthly: '$189.990', launch: '$169.990',
    includes: ['Landing de 1 página, WhatsApp, dominio, hosting y SSL', '2 redes, 8 posts y 4 historias al mes', 'Respuestas en 48 h', 'Reporte mensual'], ideal: 'Emprendedor que parte de cero' },
  { name: 'Crece', tag: 'Pyme + Marketing Pro', setup: '$349.990', monthly: '$329.990', launch: '$299.990', featured: true,
    includes: ['Sitio de 6 secciones, SEO local y 2 correos', '12 piezas al mes (2 reels) e historias semanales', 'Respuestas en 24 h', 'Gestión de 1 campaña de Meta Ads'], ideal: 'Pyme de servicios que quiere clientes constantes' },
  { name: 'Catálogo + Leads', tag: 'Automotora / Catálogo + Ads', setup: '$549.990', monthly: '$269.990', launch: '$239.990',
    includes: ['Catálogo autoadministrable', 'Campañas Meta de leads a WhatsApp o formulario', 'Píxel de Meta', 'Reporte de leads'], ideal: 'Automotoras, corredoras y venta por catálogo' },
  { name: 'Vende', tag: 'E-commerce + Marketing Pro + Ads', setup: '$699.990', monthly: '$479.990', launch: '$429.990',
    includes: ['Tienda con Webpay o Mercado Pago, 50 productos', 'Marketing Pro', 'Catálogo de Meta y remarketing'], ideal: 'Tienda que quiere vender online' },
  { name: 'Total', tag: 'Web + App + Marketing Full', setup: 'desde $1.790.000', monthly: 'desde $599.990', launch: 'desde $549.990',
    includes: ['Sitio Pyme', 'App MVP/PWA con pago por hitos', 'Marketing Full con lanzamiento de la app'], ideal: 'Negocio que lanza una app o plataforma' },
];
/** Onboarding único de los planes solo marketing (gratis en los combinados). */
export const MARKETING_ONBOARDING = { price: '$99.990', includes: 'Auditoría de redes, perfil y bio, píxel de Meta y GA4' };
export const MARKETING_PACKS: MktPack[] = [
  { name: 'Marketing Básico', setup: '$99.990', monthly: '$189.990', launch: '$149.990',
    includes: ['Instagram + Facebook', '8 posts y 4 historias al mes', 'Respuestas en 48 h', 'Reporte mensual'] },
  { name: 'Marketing Pro', setup: '$99.990', monthly: '$349.990', launch: '$299.990', featured: true,
    includes: ['Instagram + Facebook', '12 piezas al mes (2 reels) e historias semanales', 'Respuestas en 24 h', 'Gestión de 1 campaña de Meta Ads (pauta hasta $400.000)'] },
  { name: 'Marketing Full / Captación', setup: '$99.990', monthly: '$549.990', launch: '$489.990',
    includes: ['Instagram + Facebook + TikTok', '16 piezas al mes (4 reels)', 'Meta Ads y landing de captación', 'Seguimiento de leads por WhatsApp y reunión mensual'] },
  { name: 'Solo Ads', setup: '$99.990', monthly: '$149.990', launch: null,
    includes: ['Gestión de Meta Ads (Facebook e Instagram)', 'Hasta 3 campañas', 'Pauta hasta $400.000', 'Sobre ese monto, +15 % de la pauta'] },
];
/** Software a medida (pack opcional de la propuesta). */
export const CUSTOM_PACK = { name: 'Software a medida', setup: 'desde $1.900.000', monthly: 'desde $79.990' };
export const ADS_NOTE = 'La pauta publicitaria (lo que se paga a Meta) va siempre aparte.';

/** Proyectos / casos. `metrics` son PLACEHOLDER hasta que cada cliente valide cifras reales. */
export type Case = {
  slug: string; name: string; meta: string; url: string; image: string; summary: string;
  stack: string[]; service: string; year: string; built: string[];
  challenge: string | null; // null => se muestra marcador "por completar"
  metrics: { label: string; value: string | null }[]; // value null => marcador
  note?: string;
};
export const CASES: Case[] = [
  { slug: 'rg-motors-chile', name: 'RG Motors Chile', meta: 'Automotora', url: 'rgmotorschile.cl', image: '/cases/rgmotors.jpg',
    summary: 'Plataforma de venta de vehículos con catálogo en vivo, consignación, comparador y visor 360° propio.',
    stack: ['Next.js', 'Supabase', 'Three.js'], service: 'Plataforma web', year: '2026',
    built: ['Catálogo de vehículos en vivo administrado desde un panel', 'Flujo de consignación de vehículos', 'Comparador de modelos', 'Visor 360° de interiores desarrollado a medida con Three.js'],
    challenge: null,
    metrics: [{ label: 'Consultas mensuales', value: null }, { label: 'Tiempo de carga (LCP)', value: null }, { label: 'Vehículos publicados', value: null }] },
  { slug: 'salgado-automotriz', name: 'Salgado Automotriz', meta: 'Automotora', url: 'salgadoautomotriz.cl', image: '/cases/salgado.jpg',
    summary: 'Sitio con inventario, buscador por marca/modelo, comparador, financiamiento y consignación.',
    stack: ['Next.js', 'Tailwind', 'Supabase'], service: 'Plataforma web', year: '2026',
    built: ['Inventario con buscador por marca y modelo', 'Comparador de vehículos', 'Secciones de financiamiento y consignación', 'Diseño adaptado a celular'],
    challenge: null,
    metrics: [{ label: 'Consultas mensuales', value: null }, { label: 'Tiempo de carga (LCP)', value: null }, { label: 'Visitas desde celular', value: null }] },
  { slug: 'frio-austral', name: 'Frío Austral', meta: 'Climatización · Taller + academia', url: 'frio-austral · propuesta', image: '/cases/frioaustral.jpg',
    summary: 'Sitio con los cursos primero: portada con video real del técnico del taller, academia de A/C automotriz en video + PDF con pago en Hotmart, taller y tienda.',
    stack: ['HTML/CSS/JS', 'Video', 'Hotmart'], service: 'Sitio + tienda', year: '2026',
    built: ['Portada con video real del técnico explicando en el taller', 'Cursos primero: academia en video + PDF con compra en Hotmart', 'Página del taller con servicios, horario y mapa', 'Tienda de herramientas e insumos con aviso de apertura'],
    challenge: null,
    metrics: [{ label: 'Inscripciones a cursos', value: null }, { label: 'Ventas en tienda', value: null }, { label: 'Tiempo de carga (LCP)', value: null }],
    note: 'Propuesta de diseño. Ubicación y alcance por confirmar con el cliente.' },
  { slug: 'unidades-chile', name: 'Unidades Chile', meta: 'Automotora', url: 'unidadeschile.cl', image: '/cases/unidadeschile.jpg',
    summary: 'Sitio de automotora con stock disponible, comparador, consignación y financiamiento, y contacto directo por WhatsApp.',
    stack: ['React', 'Supabase'], service: 'Plataforma web', year: '2026',
    built: ['Catálogo con stock disponible y precios', 'Comparador de vehículos', 'Secciones de consignación y financiamiento', 'Botón de WhatsApp y aviso de cookies'],
    challenge: null,
    metrics: [{ label: 'Consultas mensuales', value: null }, { label: 'Tiempo de carga (LCP)', value: null }, { label: 'Vehículos publicados', value: null }] },
  { slug: 'suertu2s', name: 'Suertu2s', meta: 'Ilustraciones digitales · Premios', url: 'suertu2s.cl', image: '/cases/suertu2s.jpg',
    summary: 'Tienda de packs de ilustraciones digitales que regalan tickets para una campaña de premios, con cuenta regresiva, pago con Flow y consulta de tickets por correo.',
    stack: ['Next.js', 'Flow'], service: 'Plataforma web', year: '2026',
    built: ['Packs de ilustraciones con carrito y pago con Flow', 'Tickets de participación enviados por correo', 'Consulta de tickets con el correo de compra', 'Cuenta regresiva a la premiación y preguntas frecuentes'],
    challenge: null,
    metrics: [{ label: 'Packs vendidos', value: null }, { label: 'Tiempo de carga (LCP)', value: null }, { label: 'Visitas desde celular', value: null }] },
];

export const STEPS = [
  { title: 'Descubrimiento', desc: 'Una reunión de 30 minutos para entender tu negocio, tus clientes y qué significa “éxito” para ti.', when: 'Semana 0' },
  { title: 'Diseño', desc: 'Prototipo navegable que apruebas antes de escribir una sola línea de código.', when: 'Semana 1' },
  { title: 'Desarrollo', desc: 'Construimos por etapas, con avances que revisas cada semana en un enlace privado.', when: 'Semanas 2–5' },
  { title: 'QA', desc: 'Pruebas en celulares reales, velocidad, accesibilidad y seguridad antes de publicar.', when: 'Antes de lanzar' },
  { title: 'Lanzamiento', desc: 'Publicamos, conectamos dominio, analítica y Google, y te capacitamos.', when: 'Día D' },
  { title: 'Soporte', desc: 'Mensualidad con respaldos, monitoreo, cambios y respuesta directa por WhatsApp.', when: 'Siempre' },
];

export const STACK = [
  ['Next.js', 'Web', 'Sitios y plataformas rápidas con renderizado en servidor y SEO sólido.'],
  ['React', 'UI', 'Interfaces modernas, reutilizables y fáciles de mantener.'],
  ['TypeScript', 'Lenguaje', 'Código tipado: menos errores en producción.'],
  ['Node.js', 'Backend', 'APIs y automatizaciones que conectan tus sistemas.'],
  ['Flutter', 'Móvil', 'Una sola base de código para iOS y Android.'],
  ['React Native', 'Móvil', 'Apps nativas con el ecosistema de React.'],
  ['PostgreSQL', 'Datos', 'Base de datos robusta para información crítica.'],
  ['Supabase', 'Cloud', 'Autenticación, base de datos y archivos listos para escalar.'],
  ['Three.js', '3D', 'Experiencias 3D y visores interactivos en el navegador.'],
  ['Python', 'Datos', 'Análisis, modelos y automatización de reportes.'],
  ['Power BI', 'BI', 'Dashboards ejecutivos conectados a tus datos.'],
  ['Cloudflare', 'Seguridad', 'CDN, DNS y protección contra ataques.'],
] as const;

export const MARQUEE = ['Next.js', 'React', 'TypeScript', 'Node.js', 'Flutter', 'PostgreSQL', 'Supabase', 'Three.js', 'Python', 'Power BI', 'Cloudflare', 'Vercel'];

/** Contadores: SOLO datos reales y verificables. */
export const COUNTERS = [
  { value: 7, label: 'Especialidades: software, escritorio, web, apps, seguridad, datos y marketing digital' },
  { value: 17, label: 'Packs con precio publicado, sin “cotiza para saber”' },
  { value: 10, label: 'Cupos Clientes Fundadores hasta el 30/11/2026' },
];

export const WHY = [
  ['Todo queda a tu nombre', 'Dominio, código, contenidos y cuentas te pertenecen. Nunca secuestramos tu marca.'],
  ['Precio publicado', 'Packs de software y marketing con valores visibles. Sabes cuánto cuesta antes de la primera reunión.'],
  ['Sin permanencia', 'Mensualidad mes a mes con 30 días de aviso en los planes con pago inicial.'],
  ['Trato directo', 'Trabajamos con empresas de todo Chile, por videollamada o en persona.'],
  ['Seguridad desde el día uno', 'HTTPS, respaldos automáticos y buenas prácticas en cada proyecto.'],
  ['Hablas con quien programa', 'Sin intermediarios: soporte directo por WhatsApp con el equipo que construyó tu proyecto.'],
] as const;

/** Opciones del formulario (deben coincidir con la validación del servidor en lib/contact-schema.ts). */
export const PROJECT_TYPES = ['Sitio web', 'E-commerce', 'App móvil', 'Software a medida', 'Software de escritorio', 'Seguridad informática', 'Ciencia de datos'] as const;
export const BUDGETS = ['Menos de $300.000', '$300.000 – $700.000', '$700.000 – $1.500.000', 'Más de $1.500.000', 'Aún no lo sé'] as const;

export const FOUNDERS = {
  title: 'Clientes Fundadores — 10 cupos',
  text: 'Hasta el 30 de noviembre de 2026: 30% de descuento en el pago inicial y el primer mes gratis.',
};

/**
 * /nosotros — manifiesto (texto idéntico al publicado; solo cambia su presentación).
 * `MANIFESTO_KEYS`: frases que se "cromean" al completarse (deben aparecer tal cual en MANIFESTO).
 */
export const MANIFESTO = 'Creemos que cualquier pyme, esté donde esté, merece la misma calidad técnica que una gran empresa. Por eso publicamos nuestros precios, dejamos todo a tu nombre y te atiende quien programa.';
export const MANIFESTO_KEYS = ['misma calidad técnica', 'publicamos nuestros precios', 'todo a tu nombre', 'te atiende quien programa'] as const;
export const MANIFESTO_SIDE = [
  ['Cobertura', 'Todo Chile · remoto y presencial'],
  ['Atención', 'Directa, con quien programa tu proyecto'],
  ['Especialidades', 'Software, web, apps, seguridad, datos y marketing digital'],
] as const;

/**
 * EQUIPO — completar con datos oficiales. La sección NO se renderiza hasta que haya al menos
 * una persona lista (ver `TEAM_READY`): en el sitio en vivo nunca se muestran marcadores.
 * - `ready: true` → se publica (requiere nombre, cargo y bio reales, sin [corchetes]).
 * - `photo`: ruta en /public (p. ej. '/team/mathias.jpg', retrato 4:5). null → monograma de cromo (iniciales).
 * - `links`: LinkedIn/GitHub opcionales ({ label, href }).
 * - `reserved: true` → nunca se publica (marcador interno).
 * Todo texto entre [corchetes] es un marcador visible: NO inventar nombres, cargos ni biografías.
 */
export type TeamMember = {
  name: string; role: string; bio: string; photo?: string | null;
  links?: { label: string; href: string }[]; reserved?: boolean; ready?: boolean;
};
export const TEAM: TeamMember[] = [
  { name: 'Mathias Jara', role: 'Fundador', ready: true, photo: null, links: [],
    bio: 'Diseña y desarrolla cada proyecto de South Software. Trabaja directo contigo, sin intermediarios, desde la primera conversación hasta la puesta en producción, para empresas de todo Chile.' },
  { name: 'Ramón Ojeda', role: 'Experto en marketing', ready: true, photo: null, links: [],
    bio: 'Lidera la marca, las redes sociales y las campañas de South Software. Se encarga de que cada proyecto llegue a las personas correctas, con un mensaje claro y una comunicación cercana con cada cliente.' },
];
/** Personas publicables: `ready`, no reservadas y sin marcadores [..] en nombre, cargo ni bio. */
export const isTeamMemberReady = (m: TeamMember) =>
  !!m.ready && !m.reserved && ![m.name, m.role, m.bio].some((t) => !t.trim() || t.includes('['));
export const TEAM_READY: TeamMember[] = TEAM.filter(isTeamMemberReady);
