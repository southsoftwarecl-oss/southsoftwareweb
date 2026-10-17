'use client';
/**
 * Mensajes de éxito/error del formulario (Framer Motion). Se carga de forma
 * diferida desde ContactForm recién cuando hay algo que mostrar.
 */
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';

export default function FormFeedback({ status, serverMsg, demo }: { status: string; serverMsg: string; demo: boolean }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {status === 'done' && (
          <m.div key="ok" className="ok" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span>¡Listo! Te contactamos dentro de 24 horas hábiles.{demo && <small className="demo"> Modo demo: el mensaje fue validado pero no enviado (falta configurar RESEND_API_KEY).</small>}</span>
          </m.div>
        )}
        {status === 'error' && serverMsg && (
          <m.div key="err" className="ko" role="alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{serverMsg}</m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
