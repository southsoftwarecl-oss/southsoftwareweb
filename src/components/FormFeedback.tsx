'use client';
/**
 * Mensajes de éxito/error del formulario (Framer Motion). Se carga de forma
 * diferida desde ContactForm / BriefStudio recién cuando hay algo que mostrar.
 * En error ofrece siempre las alternativas: WhatsApp (con el brief precargado) y email.
 */
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { BRAND } from '@/content/site';

export default function FormFeedback({ status, serverMsg, waHref }: { status: string; serverMsg: string; waHref?: string }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {status === 'done' && (
          <m.div key="ok" className="ok" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span>¡Listo! Te contactamos dentro de 24 horas hábiles.</span>
          </m.div>
        )}
        {status === 'error' && serverMsg && (
          <m.div key="err" className="ko" role="alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {serverMsg}
            <span className="ko-alt">
              {waHref && <><a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a><span aria-hidden="true"> · </span></>}
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
