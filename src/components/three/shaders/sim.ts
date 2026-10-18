/**
 * Shaders de la simulación GPGPU (GPUComputationRenderer).
 * texturePosition.xyz = posición local; textureVelocity.xyz = velocidad.
 * Texturas de datos: tText (xyz destino texto, w = retardo de la intro),
 * tSphere (xyz destino esfera, w = rnd), tScatter (nube inicial), tNbr (4 índices vecinos).
 */
import { NOISE } from './noise';

export const SIM_VEL = /* glsl */ `
uniform float uDt,uT,uMix,uIn,uAmp,uScale,uCursor,uR,uRipT,uRipA,uLive,uTex;
uniform vec3 uMouse,uRipO;uniform vec2 uMVel;
uniform sampler2D tText,tSphere,tScatter,tNbr;
${NOISE}
vec2 idxUv(float i){return (vec2(mod(i,uTex),floor(i/uTex))+.5)/uTex;}
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec3 p=texture2D(texturePosition,uv).xyz;
  vec3 v=texture2D(textureVelocity,uv).xyz;
  vec4 T=texture2D(tText,uv);vec4 S=texture2D(tSphere,uv);vec3 C=texture2D(tScatter,uv).xyz;
  float m=uMix;
  // intro: retardo por partícula (rnd*.5 combinado con onda izquierda→derecha)
  float li=smoothstep(T.w,T.w+.5,uIn);
  // cursor (unidades locales): gaussiana exp(-(d/r)^2*2), empuje máx .35 XY / .5 Z
  vec2 d=p.xy-uMouse.xy;float dl=length(d)*uScale;float g=exp(-pow(dl/uR,2.)*2.)*uCursor;
  vec3 off=vec3(normalize(d+1e-5)*.35*g,.5*g)/uScale;
  // arrastre tangencial por la velocidad del cursor (.25)
  off.xy+=uMVel*.25*g;
  // onda que nace donde se detiene el cursor: sin(12d-9t)·exp(-3d)·.04
  float rd=length(p.xy-uRipO.xy)*uScale;
  off.z+=sin(12.*rd-9.*uRipT)*exp(-3.*rd)*.04*uRipA/uScale;
  vec3 tT=mix(C,T.xyz+off,li);vec3 tS=mix(C,S.xyz+off,li);
  // resortes: texto k=18 y esfera k=10 mezclados por uMix
  vec3 a=(1.-m)*18.*(tT-p)+m*10.*(tS-p);
  // cohesión .6 hacia el centroide de 4 vecinos fijos
  vec4 nb=texture2D(tNbr,uv);
  vec3 cen=(texture2D(texturePosition,idxUv(nb.x)).xyz+texture2D(texturePosition,idxUv(nb.y)).xyz+texture2D(texturePosition,idxUv(nb.z)).xyz+texture2D(texturePosition,idxUv(nb.w)).xyz)*.25;
  a+=.6*(cen-p);
  // curl noise (3 octavas, f=.35, tiempo .12), amplitud .18 → .45 con uMix
  a+=curl3(p,.35,uT*.12)*uAmp*uLive*li;
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
