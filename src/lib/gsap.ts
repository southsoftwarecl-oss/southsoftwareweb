/** Registro único de plugins GSAP + easings de marca: `south` (0.16,1,0.3,1), `south-in` (salidas) y `mercury`. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';

let registered = false;
export function setupGsap() {
  if (registered) return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Flip);
  CustomEase.create('south', '0.16,1,0.3,1');
  // salidas (aceleran hacia el final)
  CustomEase.create('south-in', '0.7,0,0.84,0');
  // "mercurio": leve sobrepaso y asentamiento. SOLO intro del titular y morph esfera→texto al subir
  CustomEase.create('mercury', 'M0,0 C0.2,0 0.1,1.12 0.42,1.02 0.62,0.98 0.8,1 1,1');
  gsap.defaults({ ease: 'south', duration: 1 });
}
export { gsap, ScrollTrigger, SplitText, Flip };
