'use client';
/** Marco común de las mini-demos: escenario aria-hidden + descripción sr-only + controles (pausa WCAG 2.2.2). */
import type { ReactNode, RefObject } from 'react';
import { DEMO_DESC } from '@/content/servicios';
import { useReducedMotion } from '../hooks';

export default function DemoFrame({ slug, root, paused, onPause, controls, children, className = '' }: {
  slug: string; root: RefObject<HTMLDivElement | null>; paused: boolean; onPause: () => void; controls?: ReactNode; children: ReactNode; className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div className={`dm ${className}`.trim()} ref={root} data-demo={slug}>
      <div className="dm-stage" aria-hidden="true">{children}</div>
      <p className="sr-only">{DEMO_DESC[slug]}</p>
      <div className="dm-ctl">
        {controls}
        {!reduced && (
          <button type="button" className="dm-btn dm-pause" aria-pressed={paused} aria-label="Pausar animación" onClick={onPause}>
            {paused
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" /></svg>}
          </button>
        )}
      </div>
    </div>
  );
}
