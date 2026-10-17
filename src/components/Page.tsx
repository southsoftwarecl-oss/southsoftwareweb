/**
 * Envoltorio de página con View Transition (React <ViewTransition>):
 * la página saliente se desvanece y la entrante sube con easing de marca.
 * CSS en globals.css → "View transitions". Sin soporte del navegador, no anima.
 */
import { ViewTransition, type ReactNode } from 'react';
import { RouteMotion } from './MotionRoot';

export default function Page({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className="page">{children}<RouteMotion /></div>
    </ViewTransition>
  );
}
