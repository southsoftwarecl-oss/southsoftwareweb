/** Botón flotante de WhatsApp (aparece tras el hero vía MotionRoot). Número en content/site.ts (WHATSAPP_NUMBER) */
import { WA_URL } from '@/content/site';
import { WaIcon } from './ui';

export default function WaFloat() {
  return (
    <a className="wa-float" href={WA_URL} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp">
      <WaIcon /><span>WhatsApp</span>
    </a>
  );
}
