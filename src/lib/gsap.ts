/** Registro único de plugins GSAP + easing de marca `south` = cubic-bezier(0.16,1,0.3,1). */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

let registered = false;
export function setupGsap() {
  if (registered) return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('south', '0.16,1,0.3,1');
  gsap.defaults({ ease: 'south', duration: 1 });
}
export { gsap, ScrollTrigger, SplitText };
