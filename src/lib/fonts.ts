/**
 * Fuentes auto-hospedadas (next/font/local → sin requests a terceros).
 * Satoshi (ITF Free Font License, self-hosting permitido), Inter, JetBrains Mono
 * y Michroma (SIL OFL). Licencias en src/fonts/licenses/.
 */
import localFont from 'next/font/local';

export const satoshi = localFont({ src: '../fonts/Satoshi-Variable.woff2', weight: '300 900', variable: '--ff-satoshi', display: 'swap' });
export const inter = localFont({ src: '../fonts/Inter-Variable.woff2', weight: '100 900', variable: '--ff-inter', display: 'swap' });
export const jetbrains = localFont({ src: '../fonts/JetBrainsMono-Variable.woff2', weight: '100 800', variable: '--ff-jetbrains', display: 'swap', preload: false });
// Michroma: logotipo, preloader y muestreo de partículas
export const michroma = localFont({ src: '../fonts/Michroma-Regular.woff2', weight: '400', variable: '--ff-michroma', display: 'block' });

export const fontVars = [satoshi.variable, inter.variable, jetbrains.variable, michroma.variable].join(' ');
/** Familia CSS real (con hash) para usar en canvas 2D. */
export const michromaFamily = michroma.style.fontFamily;
