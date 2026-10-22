/**
 * Render "metal líquido": gotas impostoras (THREE.Points) con normal esférica
 * n = (uv*2-1, sqrt(1-r²)) y PBR aproximado (metalness 1):
 *  - entorno: RoomEnvironment → PMREM muestreado por rugosidad (textureCubeUV),
 *    o matcap cromado 256px en móvil/gama baja (define USE_MATCAP);
 *  - Fresnel Schlick F0 = (.91,.92,.95), tinte de borde (token --accent) al 25%;
 *  - especular GGX de una luz principal arriba-izquierda + contraluz tenue (token --accent-deep).
 * Los colores llegan como uniforms desde los tokens CSS (sin hex en el código).
 */

/** Sombreado cromado compartido por las gotas y la superficie líquida. */
export const CHROME = /* glsl */ `
uniform vec3 uRim,uBackRim,uBg,uAccent;uniform float uEnvI,uKey,uSweep,uFog,uTime;
#ifdef USE_MATCAP
uniform sampler2D tMatcap;
#else
uniform sampler2D envMap;
#endif
vec3 shadeChrome(vec3 n,float rough){
  vec3 V=vec3(0.,0.,1.);float NdV=max(dot(n,V),1e-3);
  vec3 R=reflect(-V,n);
#ifdef USE_MATCAP
  vec3 env=texture2D(tMatcap,n.xy*.49+.5).rgb;env*=env; // sRGB aprox → lineal
#else
  vec3 env=textureCubeUV(envMap,R,rough).rgb*uEnvI;
#endif
  vec3 F0=vec3(.91,.92,.95);
  vec3 F=F0+(1.-F0)*pow(1.-NdV,5.);
  vec3 col=env*F;
  // GGX: luz principal arriba-izquierda
  vec3 L=normalize(vec3(-.55,.65,.52));vec3 H=normalize(L+V);
  float NdL=max(dot(n,L),0.);float NdH=max(dot(n,H),0.);
  float a=rough*rough;float a2=a*a;float dd=NdH*NdH*(a2-1.)+1.;float D=a2/(3.14159265*dd*dd);
  float k=(rough+1.)*(rough+1.)/8.;float G=(NdL/(NdL*(1.-k)+k))*(NdV/(NdV*(1.-k)+k));
  col+=D*G*F/(4.*NdL*NdV+1e-3)*NdL*uKey;
  // tinte de borde 25 %
  float fr=pow(1.-NdV,3.);
  col=mix(col,uRim*(dot(col,vec3(.3333))+.25),.25*fr);
  // contraluz acero tenue
  col+=uBackRim*pow(1.-NdV,4.)*max(dot(n.xy,vec2(.83,-.55)),0.)*.6;
  return col;
}
// barrido de luz (metal cepillado): banda en X de pantalla, +60 % brillo y 10 % hacia el acento; niebla exponencial a negro
vec3 finish(vec3 col,float sx,float depth){
  float band=exp(-pow((sx-uSweep)/.13,2.));
  col*=1.+.6*band;
  col=mix(col,uAccent*(dot(col,vec3(.3333))+.15),.1*band);
  return mix(uBg,col,exp(-uFog*max(depth-12.,0.)));
}`;

const ENV_HEAD = /* glsl */ `
#ifndef USE_MATCAP
#define ENVMAP_TYPE_CUBE_UV
#include <cube_uv_reflection_fragment>
#endif
`;

/** Gotas impostoras: tamaño 2.2–4.0 px a DPR 1 (variación por rnd), se aplanan con la profundidad en la esfera. */
export const DROP_VERT = /* glsl */ `
uniform sampler2D tPos;uniform float uDpr,uMix,uPxPerUnit;
attribute vec2 ref;attribute float rnd;
varying float vRnd;varying float vFlat;varying float vRad;varying float vEye;varying float vSx;
void main(){
  vec3 p=texture2D(tPos,ref).xyz;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  float d=-mv.z;
  vRnd=rnd;vEye=d;
  vFlat=uMix*clamp((d-11.5)/3.5,0.,1.);
  // "DOF": las gotas que pasan cerca de la cámara (estallidos) crecen como bokeh
  float px=mix(2.2,4.,rnd)*uDpr*(13./d)*(1.+clamp((10.5-d)*.3,0.,1.6));
  gl_PointSize=px;
  vRad=.5*px/(uPxPerUnit*13./d); // radio en unidades de mundo (para la pasada de profundidad)
  gl_Position=projectionMatrix*mv;
  vSx=gl_Position.x/gl_Position.w;
}`;

export const DROP_FRAG = /* glsl */ `
${ENV_HEAD}
${CHROME}
varying float vRnd;varying float vFlat;varying float vEye;varying float vSx;
void main(){
  vec2 c=gl_PointCoord*2.-1.;c.y=-c.y;float r2=dot(c,c);if(r2>1.)discard;
  vec3 n=normalize(vec3(c,sqrt(1.-r2)*(1.-.5*vFlat)));
  float rough=.16+(vRnd-.5)*.12;
  // brillo por partícula (.75–1.05) + titileo lento
  float br=mix(.75,1.05,vRnd)*(1.+.08*sin(uTime*1.3+vRnd*40.));
  gl_FragColor=vec4(finish(shadeChrome(n,rough)*br,vSx,vEye),1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---------- Pasada de fluido en espacio de pantalla (solo gama alta) ---------- */

/** Profundidad de la superficie de cada gota (R = profundidad de vista, G = máscara). */
export const DEPTH_FRAG = /* glsl */ `
varying float vRad;varying float vEye;
void main(){
  vec2 c=gl_PointCoord*2.-1.;float r2=dot(c,c);if(r2>1.)discard;
  gl_FragColor=vec4(vEye-sqrt(1.-r2)*vRad,1.,0.,1.);
}`;

/** Espesor acumulado (mezcla aditiva). */
export const THICK_FRAG = /* glsl */ `
void main(){
  vec2 c=gl_PointCoord*2.-1.;float r2=dot(c,c);if(r2>1.)discard;
  gl_FragColor=vec4(0.,(1.-r2)*.12,0.,1.);
}`;

export const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

/**
 * Desenfoque bilateral separable (radio 6 px de la FBO a media resolución):
 * R = profundidad (preserva bordes), G = espesor (gaussiano).
 * uFirst: la primera pasada combina profundidad (tA) y espesor (tB).
 */
export const BLUR_FRAG = /* glsl */ `
uniform sampler2D tA,tB;uniform vec2 uDir;uniform float uFirst;
varying vec2 vUv;
vec2 fetch(vec2 uv){
  if(uFirst>.5){vec4 a=texture2D(tA,uv);return vec2(a.g>.5?a.r:0.,texture2D(tB,uv).g);}
  return texture2D(tA,uv).rg;
}
void main(){
  vec2 c=fetch(vUv);
  float z0=c.x;float ws=0.;float zs=0.;float ts=0.;float wt=0.;
  for(int i=-6;i<=6;i++){
    float fi=float(i);
    vec2 s=fetch(vUv+uDir*fi);
    float w=exp(-fi*fi/18.);
    ts+=s.y*w;wt+=w;
    if(s.x>0.){
      float wr=z0>0.?exp(-pow((s.x-z0)/.35,2.)):1.;
      zs+=s.x*w*wr;ws+=w*wr;
    }
  }
  gl_FragColor=vec4(ws>0.?zs/ws:0.,ts/wt,0.,1.);
}`;

/** Composición: normales desde la profundidad suavizada y mismo cromo PBR; opacidad uLiquid. */
export const COMP_FRAG = /* glsl */ `
${ENV_HEAD}
${CHROME}
uniform sampler2D tS;uniform vec2 uTexel,uTan,uMouseUv;uniform float uLiquid,uAspect,uRUv,uThr;
varying vec2 vUv;
vec3 viewPos(vec2 uv,float z){return vec3((uv*2.-1.)*uTan*z,-z);}
void main(){
  vec2 s=texture2D(tS,vUv).rg;
  if(s.y<uThr||s.x<=0.)discard;
  vec3 P=viewPos(vUv,s.x);
  float zr=texture2D(tS,vUv+vec2(uTexel.x,0.)).r,zl=texture2D(tS,vUv-vec2(uTexel.x,0.)).r;
  float zu=texture2D(tS,vUv+vec2(0.,uTexel.y)).r,zd=texture2D(tS,vUv-vec2(0.,uTexel.y)).r;
  vec3 dx=abs(zr-s.x)<abs(zl-s.x)&&zr>0.?viewPos(vUv+vec2(uTexel.x,0.),zr)-P:P-viewPos(vUv-vec2(uTexel.x,0.),zl>0.?zl:s.x);
  vec3 dy=abs(zu-s.x)<abs(zd-s.x)&&zu>0.?viewPos(vUv+vec2(0.,uTexel.y),zu)-P:P-viewPos(vUv-vec2(0.,uTexel.y),zd>0.?zd:s.x);
  vec3 nd=normalize(cross(dx,dy));
  if(nd.z<0.)nd=-nd;
  // el espesor suavizado da bordes redondeados y estables (tubo de metal); se mezcla con la normal de profundidad
  float tx=texture2D(tS,vUv+vec2(2.*uTexel.x,0.)).g-texture2D(tS,vUv-vec2(2.*uTexel.x,0.)).g;
  float ty=texture2D(tS,vUv+vec2(0.,2.*uTexel.y)).g-texture2D(tS,vUv-vec2(0.,2.*uTexel.y)).g;
  vec3 nt=normalize(vec3(-tx*38.,-ty*38.,1.));
  vec3 n=normalize(mix(nd,nt,.8));
  // cerca del cursor el líquido se "abre" (.85 → .3)
  vec2 dm=(vUv-uMouseUv)*vec2(uAspect,1.);
  float near=exp(-pow(length(dm)/uRUv,2.)*2.);
  float liq=uLiquid*mix(1.,.3/.85,near);
  float alpha=smoothstep(uThr,uThr*2.4,s.y)*liq;
  gl_FragColor=vec4(finish(shadeChrome(n,.14),vUv.x*2.-1.,s.x),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
