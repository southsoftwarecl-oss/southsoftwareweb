/**
 * Blog: estructura lista para publicar. SIN artículos inventados: POSTS queda vacío hasta que
 * South Software escriba y apruebe el primero. Autor siempre la organización (sin nombres de personas).
 * Al agregar un post: el listado, el sitemap y /blog/[slug] lo toman solos; /blog deja de ser noindex.
 */
export type Post = {
  slug: string; title: string; description: string; // 140–155 caracteres
  date: string; // ISO (YYYY-MM-DD)
  updated?: string; image?: string; // ruta en /public, 1200×630
  body: string[]; // párrafos
};
export const BLOG_AUTHOR = 'South Software';
export const POSTS: Post[] = [];
