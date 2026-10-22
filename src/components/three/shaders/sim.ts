/**
 * Shaders de la simulación GPGPU (GPUComputationRenderer).
 * texturePosition.xyz = posición local; textureVelocity.xyz = velocidad.
 * Texturas de datos: tText (xyz destino texto, w = retardo de la intro),
 * tA/tB (formas origen/destino del morph), tScatter (nube inicial, w = retardo del morph), tNbr (4 índices vecinos).
 */
import { NOISE } from './noise';

export const SIM_VEL = /* glsl */ `
uniform float uDt,uT,uIn,uAmp,uScale,uCursor,uR,uRipT,uRipA,uLive,uTex;
uniform float uU,uKA,uKB,uSpinA,uSpinB,uLogoA,uLogoB,uBurst,uCy,uDis;uniform vec2 uXr;
uniform vec3 uMouse,uRipO;uniform vec2 uMVel;
uniform sampler2D tText,tA,tB,tScatter,tNbr;
${NOISE}
vec2 idxUv(float i){return (vec2(mod(i,uTex),floor(i/uTex))+.5)/uTex;}
vec3 spin(vec3 q,float on){float a=uT*.22*on;float c=cos(a),s=sin(a);q.y-=uCy;q=vec3(c*q.x+s*q.z,q.y,-s*q.x+c*q.z);q.y+=uCy;return q;}
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec3 p=texture2D(texturePosition,uv).xyz;
  vec3 v=texture2D(textureVelocity,uv).xyz;
  vec4 T=texture2D(tText,uv);vec4 Cs=texture2D(tScatter,uv);vec3 C=Cs.xyz;
  float rnd=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453);
  // morph forma A → forma B; cada partícula con su retardo (Cs.w, 0–.16 del tramo) → la forma "se teje"
  float mm=smoothstep(Cs.w,Cs.w+.84,uU);
  vec3 tgt=mix(spin(texture2D(tA,uv).xyz,uSpinA),spin(texture2D(tB,uv).xyz,uSpinB),mm);
  // estallido hacia la cámara a mitad de la transición: mix + curl·sin(πt)
  float bt=sin(3.14159265*mm)*uBurst;
  vec3 dir=tgt-vec3(0.,uCy,0.);
  tgt+=vec3(dir.xy*.22,2.+2.2*rnd)*bt;
  // intro cinemática (uDis 0→1): un frente de izquierda a derecha despega cada gota del póster (estallido hacia la
  // cámara + remolino turbulento) y el resorte la devuelve a su lugar; e = sin(π·progreso local) → 0 al inicio y al final
  float xn=clamp((T.x-uXr.x)/max(uXr.y-uXr.x,1e-3),0.,1.);
  float lp=clamp((uDis*1.6-xn-rnd*.15)/.45,0.,1.);
  float e=sin(3.14159265*lp)*uLogoA;
  vec3 sw3=vec3((T.xy-vec2(0.,uCy))*.28+vec2(0.,.5*(rnd-.5)),1.4+2.6*rnd);
  float ang=e*(1.6+1.2*rnd);vec2 rc=T.xy-vec2(0.,uCy);
  vec2 rot=vec2(cos(ang)*rc.x-sin(ang)*rc.y,sin(ang)*rc.x+cos(ang)*rc.y)-rc;
  tgt+=(sw3+vec3(rot*.35,0.))*e+curl3(T.xyz*.8,.6,uT*.3+rnd)*1.1*e;
  // intro: retardo por partícula (rnd*.5 combinado con onda izquierda→derecha)
  float li=smoothstep(T.w,T.w+.5,uIn);
  // cursor (unidades locales): gaussiana exp(-(d/r)^2*2), empuje máx .35 XY / .5 Z
  vec2 d=p.xy-uMouse.xy;float dl=length(d)*uScale;float g=exp(-pow(dl/uR,2.)*2.)*uCursor;
  vec3 off=vec3(normalize(d+1e-5)*.35*g,.5*g)/uScale;
  off.xy+=uMVel*.25*g;
  float rd=length(p.xy-uRipO.xy)*uScale;
  off.z+=sin(12.*rd-9.*uRipT)*exp(-3.*rd)*.04*uRipA/uScale;
  vec3 tT=mix(C,tgt+off,li);
  // resorte amortiguado: logo k=18 (nítido, se rearma en ~.7 s al irse el cursor), formas k=10
  vec3 a=mix(uKA,uKB,mm)*(tT-p);
  // cohesión .6 hacia 4 vecinos fijos (solo tiene sentido en el logo)
  float coh=.6*mix(uLogoA,uLogoB,mm)*(1.-bt)*(1.-e);
  vec4 nb=texture2D(tNbr,uv);
  vec3 cen=(texture2D(texturePosition,idxUv(nb.x)).xyz+texture2D(texturePosition,idxUv(nb.y)).xyz+texture2D(texturePosition,idxUv(nb.z)).xyz+texture2D(texturePosition,idxUv(nb.w)).xyz)*.25;
  a+=coh*(cen-p);
  // curl noise: respiración suave en reposo, fuerte durante el estallido
  a+=curl3(p,.35,uT*.12)*uAmp*(1.+3.*bt+5.*e)*uLive*li;
  v+=a*uDt;
  v*=exp(-6.5*uDt);
  gl_FragColor=vec4(v,1.);
}`;

export const SIM_POS = /* glsl */ `
uniform float uDt;
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 p=texture2D(texturePosition,uv);
  vec3 v=texture2D(textureVelocity,uv).xyz;
  gl_FragColor=vec4(p.xyz+v*uDt,1.);
}`;
