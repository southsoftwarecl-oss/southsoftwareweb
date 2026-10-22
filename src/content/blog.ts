/**
 * Blog: estructura lista para publicar. SIN artículos inventados: solo artículos reales,
 * aprobados por South Software. Autor siempre la organización (sin nombres de personas).
 * Al agregar un post: el listado, el sitemap y /blog/[slug] lo toman solos; /blog deja de ser noindex.
 */
export type Block = string | { h2: string } | { ul: string[] };
export type Post = {
  slug: string; title: string; description: string; // 140–155 caracteres
  date: string; // ISO (YYYY-MM-DD)
  updated?: string; image?: string; // ruta en /public, 1200×630
  body: Block[]; // párrafos (admite [texto](/ruta)), { h2 } y { ul }
};
export const BLOG_AUTHOR = 'South Software';
export const POSTS: Post[] = [
  {
    slug: 'cuanto-cuesta-una-web-pyme-chile-2026',
    title: 'Cuánto cuesta una web para una pyme en Chile en 2026',
    description: 'Cuánto cuesta una web para una pyme en Chile en 2026: qué hace subir el precio, errores comunes y nuestros precios publicados. Compara antes de cotizar.',
    date: '2026-10-22',
    body: [
      'Es la primera pregunta que nos hacen y casi nunca tiene una respuesta corta. Una web puede costar muy poco o bastante, según lo que tenga que hacer por tu negocio. Somos South Software y, como publicamos nuestros precios, aquí te contamos de qué depende el costo, cuánto cobramos nosotros y qué errores conviene evitar antes de pagar.',
      { h2: 'La respuesta corta: depende de lo que la web tenga que hacer' },
      'No es lo mismo una página para que te encuentren y te escriban por WhatsApp que una tienda que cobra con tarjeta y descuenta stock. En el mercado vas a ver cotizaciones muy distintas para algo que parece igual: desde plantillas que armas tú mismo hasta desarrollos a medida. La diferencia casi siempre está en el alcance, en quién hace el trabajo y en qué pasa después de publicar.',
      'Por eso, más que buscar "el precio de una web", sirve separar el costo en dos partes: el pago inicial (diseñar y construir) y el costo mensual (hosting, mantención, soporte y cambios).',
      { h2: 'Qué hace subir o bajar el costo' },
      { ul: [
        'Tipo de sitio: una landing de una página es lo más simple; un sitio con varias secciones requiere más diseño y contenido; un catálogo o una tienda suman base de datos, administración y pagos.',
        'Diseño: una plantilla adaptada cuesta menos que un diseño propio. Lo que importa es que se vea bien en celular, cargue rápido y lleve al cliente a escribirte.',
        'Contenido: textos, fotos y fichas de productos. Si los tienes listos, el proyecto avanza más rápido; si hay que crearlos, es trabajo adicional.',
        'Tienda online: pagos con Webpay o Mercado Pago, despacho, retiro, correos automáticos y carga de productos agregan horas de desarrollo y pruebas.',
        'Mantención: actualizaciones, parches de seguridad, respaldos y cambios menores. Una web sin mantención se desactualiza y se vuelve insegura.',
        'Hosting y dominio: el servidor donde vive la web, el certificado SSL y el dominio. El dominio .cl tiene una tarifa oficial de NIC Chile de $9.990 al año, exento de IVA.',
      ] },
      { h2: 'Nuestros precios, publicados' },
      'Estos son los valores de nuestros packs en pesos chilenos, tal como aparecen en [nuestra página de packs](/packs). Todos tienen un pago inicial y una mensualidad que cubre hosting, mantención y soporte:',
      { ul: [
        'Emprende: $149.990 de pago inicial + $19.990 al mes. Landing de una página adaptada a celular, botón de WhatsApp y formulario, dominio .cl a tu nombre, hosting, SSL y soporte por WhatsApp.',
        'Pyme: $349.990 + $34.990 al mes. Sitio de hasta 6 secciones, SEO local, 2 correos corporativos, respaldo semanal y reporte mensual.',
        'Automotora / Catálogo: $549.990 + $49.990 al mes. Catálogo autoadministrable con fichas y filtros, WhatsApp con el producto precargado, respaldo diario y soporte en 24 h.',
        'E-commerce: $699.990 + $59.990 al mes. Tienda con Webpay o Mercado Pago, carga inicial de hasta 50 productos, despacho, retiro y correos automáticos, parches de seguridad y monitoreo.',
        'Software a medida: desde $1.900.000 + desde $79.990 al mes, para sistemas internos, reservas o portales.',
      ] },
      'Si además quieres que te ayudemos a conseguir clientes, en [Arma tu pack](/packs) puedes sumar un plan de marketing o Meta Ads (Facebook e Instagram). Al combinar software y marketing mensual, la mensualidad total baja 15 %. El onboarding de marketing ($99.990) se paga aparte. La pauta publicitaria, lo que se le paga a Meta, va siempre aparte.',
      { h2: 'Errores comunes al cotizar una web' },
      { ul: [
        'Comparar solo el pago inicial: una web barata con mensualidades altas, o sin mantención, puede salir más cara al año.',
        'Dejar el dominio a nombre del proveedor: el dominio y las cuentas deben quedar a nombre de tu negocio, para que puedas cambiarte cuando quieras.',
        'Pagar por más de lo que necesitas: si hoy vendes por WhatsApp, quizás te basta una landing bien hecha antes que una tienda completa.',
        'Olvidar el celular y la velocidad: la mayoría de tus clientes te va a ver desde el teléfono. Si la web carga lento o se ve mal ahí, pierdes consultas.',
        'No pedir el detalle por escrito: qué incluye, cuántas revisiones, plazos y qué pasa con los cambios después de publicar.',
        'Pensar que publicar es el final: sin alguien que mantenga la web, actualice contenidos y revise la seguridad, el sitio envejece rápido.',
      ] },
      { h2: '¿Cuál te conviene?' },
      'Si recién partes, una landing te permite estar en línea pronto y medir si llegan consultas. Si ya tienes varios servicios o quieres aparecer en búsquedas, un sitio con varias secciones y SEO te da más espacio. Si vendes productos, el catálogo o la tienda te ahorran tiempo respondiendo lo mismo. Puedes ver cómo trabajamos cada caso en [desarrollo web](/servicios/sitios-web).',
      { h2: 'Conversemos' },
      'Si no tienes claro qué necesitas, cuéntanos tu negocio y te recomendamos la opción más simple que te sirva, aunque sea la más barata. [Escríbenos](/contacto) y te respondemos con una propuesta clara, sin letra chica.',
    ],
  },
];
