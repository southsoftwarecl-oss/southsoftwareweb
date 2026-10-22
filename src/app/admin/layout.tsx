/** Layout del panel: sin chrome público (nada de Three.js, GA, nav del sitio). Estilo flat con acento #2F5C96. */
import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel South Software' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
