/** Polvo de fondo: ~3k puntos muy tenues y lejanos (aditivo, sin escribir profundidad) para dar sensación de espacio. */
import * as THREE from 'three';

const VERT = /* glsl */ `
uniform float uT,uDpr;attribute float rnd;varying float vA;
void main(){
  vec3 p=position;
  p.x+=sin(uT*.04+p.y*.3+rnd*6.)*.5;p.y+=cos(uT*.03+p.x*.2)*.35;
  vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;
  gl_PointSize=mix(1.,2.2,rnd)*uDpr*(13./max(d,1.));
  vA=(.1+.14*rnd)*(.6+.4*sin(uT*.7+rnd*50.))*exp(-.035*max(d-14.,0.));
  gl_Position=projectionMatrix*mv;
}`;
const FRAG = /* glsl */ `
uniform vec3 uC;varying float vA;
void main(){vec2 c=gl_PointCoord*2.-1.;float r=dot(c,c);if(r>1.)discard;gl_FragColor=vec4(uC*vA*(1.-r),1.);}`;

export class Dust {
  readonly points: THREE.Points;
  private mat: THREE.ShaderMaterial; private geo: THREE.BufferGeometry;
  constructor(n: number, tint: string) {
    const pos = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 46; pos[i * 3 + 1] = (Math.random() - 0.5) * 26; pos[i * 3 + 2] = -3 - Math.random() * 30; rnd[i] = Math.random(); }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.geo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uDpr: { value: 1 }, uC: { value: new THREE.Color(tint) } }, vertexShader: VERT, fragmentShader: FRAG, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: true });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = -1;
  }
  update(t: number, dpr: number) { this.mat.uniforms.uT.value = t; this.mat.uniforms.uDpr.value = dpr; }
  dispose() { this.geo.dispose(); this.mat.dispose(); }
}
