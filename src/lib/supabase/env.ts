/**
 * Config de Supabase SOLO por env, leída en runtime (todo el acceso a Supabase es desde el servidor; el navegador nunca habla con Supabase).
 *   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY  (pública, pero igual se usa solo en servidor)
 *   SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY)  opcional, solo servidor
 */
export const sbUrl = () => process.env.SUPABASE_URL || '';
export const sbPublishable = () => process.env.SUPABASE_PUBLISHABLE_KEY || '';
export const supabaseConfigured = () => !!(sbUrl() && sbPublishable());
export const serverSecretKey = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
/** 'supabase' si está configurado (y no se fuerza ADMIN_AUTH=password); si no, contraseña provisoria de fase 1. */
export const authMode = (): 'supabase' | 'password' => (supabaseConfigured() && process.env.ADMIN_AUTH !== 'password' ? 'supabase' : 'password');
