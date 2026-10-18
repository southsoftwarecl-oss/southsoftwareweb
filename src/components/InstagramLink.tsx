/** Link al Instagram oficial (BRAND.instagram) con ícono; rel="me" lo vincula como perfil propio. */
import { BRAND } from '@/content/site';

export function InstagramIcon() {
  return (
    <svg className="ig-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export default function InstagramLink({ className = '' }: { className?: string }) {
  return (
    <a className={`ig-link ${className}`.trim()} href={BRAND.instagram.url} target="_blank" rel="me noopener"
      aria-label={`Instagram de South Software (${BRAND.instagram.handle})`}>
      <InstagramIcon /><span>{BRAND.instagram.handle}</span>
    </a>
  );
}
