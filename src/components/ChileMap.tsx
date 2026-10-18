/**
 * Contorno REAL de Chile continental + curvas de nivel de los Andes (ver content/map-chile.ts).
 * Escala país, sin ciudades ni coordenadas. Server component reutilizable (/nosotros, /contacto).
 * Cada trazo lleva pathLength=1 para dibujarse con strokeDashoffset 1→0. Tier móvil/bajo: solo los
 * trazos con [data-lo] (≤ 20; el resto se oculta por CSS bajo 760 px y el runtime los retira del DOM).
 */
import { CHILE_OUTLINE, CHILE_RELIEF, CHILE_VIEWBOX } from '@/content/map-chile';

/** Atribución de las fuentes (dominio público). Mostrarla en la página que use el mapa. */
export const MAP_ATTRIBUTION = 'Mapa: contorno Natural Earth (dominio público) · relieve: SRTM y GMTED2010 (USGS), ETOPO1 (NOAA) vía Mapzen Terrain Tiles';
export const MAP_LABEL = 'Mapa de líneas de Chile con las curvas de nivel de la cordillera';
const [, , VW, VH] = CHILE_VIEWBOX.split(' ').map(Number);
export const CHILE_ASPECT = VW / VH;

const LO_OUTLINE = 12, LO_RELIEF = 8;

export default function ChileMap({ className = '' }: { className?: string }) {
  return (
    <svg className={`cmap ${className}`.trim()} viewBox={CHILE_VIEWBOX} preserveAspectRatio="xMidYMid meet" role="img" aria-label={MAP_LABEL} focusable="false">
      <g className="cmap-k" fill="none">
        {CHILE_RELIEF.map(([lvl, d], i) => <path key={i} d={d} pathLength={1} data-lvl={lvl} data-lo={i < LO_RELIEF ? '' : undefined} vectorEffect="non-scaling-stroke" />)}
      </g>
      <g className="cmap-c" fill="none">
        {CHILE_OUTLINE.map((d, i) => <path key={i} d={d} pathLength={1} data-lo={i < LO_OUTLINE ? '' : undefined} vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  );
}
