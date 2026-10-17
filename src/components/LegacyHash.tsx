'use client';
/**
 * Compatibilidad con enlaces antiguos del home (/#packs, /#proceso, /#stack, /#por-que):
 * esas secciones se movieron a otras rutas, así que se redirige en el cliente
 * (el hash nunca llega al servidor).
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const LEGACY_HASHES: Record<string, string> = {
  '#packs': '/packs',
  '#proceso': '/servicios#proceso',
  '#stack': '/servicios#stack',
  '#por-que': '/nosotros#por-que',
};

export default function LegacyHash() {
  const router = useRouter();
  useEffect(() => {
    const go = () => { const to = LEGACY_HASHES[location.hash]; if (to) router.replace(to); };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [router]);
  return null;
}
