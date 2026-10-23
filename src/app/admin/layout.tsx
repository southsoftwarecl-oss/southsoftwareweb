/** Layout del panel: sin chrome público (nada de Three.js, GA, nav del sitio). Tema claro/oscuro sin flash (script antes del primer pintado). */
import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel South Software' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// Lee la preferencia (claro / oscuro / sistema) y la aplica al contenedor antes de pintar. Script estático, sin datos de usuario.
const THEME_SCRIPT = `(function(){try{var r=document.getElementById('admin-root');var t=localStorage.getItem('ss-admin-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);r.setAttribute('data-theme',d?'dark':'light');if(localStorage.getItem('ss-admin-sb')==='1')r.setAttribute('data-sb','1')}catch(e){}})()`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root" id="admin-root" data-theme="light" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </div>
  );
}
