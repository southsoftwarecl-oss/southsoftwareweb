/** Link a la Página de Facebook oficial (BRAND.facebook), mismo estilo de línea que InstagramLink. */
import { BRAND } from '@/content/site';

export function FacebookIcon() {
  return (
    <svg className="ig-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" /><path d="M15.5 7.5h-1.7c-1.3 0-2.3 1-2.3 2.3V21M9 13h6" />
    </svg>
  );
}

export default function FacebookLink({ className = '', label = true }: { className?: string; label?: boolean }) {
  return (
    <a className={`ig-link ${className}`.trim()} href={BRAND.facebook.url} target="_blank" rel="me noopener"
      aria-label="Página de Facebook de South Software">
      <FacebookIcon />{label && <span>Facebook</span>}
    </a>
  );
}
