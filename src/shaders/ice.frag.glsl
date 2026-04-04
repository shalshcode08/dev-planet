#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Fresnel rim glow
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 3.0);

  // Crystalline crack pattern
  float cracks = snoise(vUv * 20.0 + time * 0.005) * 0.5 + 0.5;
  float fineCracks = snoise(vUv * 50.0) * 0.5 + 0.5;
  float crystal = mix(cracks, fineCracks, 0.4);

  vec3 iceBase = mix(vec3(0.72, 0.90, 1.0), vec3(0.85, 0.96, 1.0), crystal);
  vec3 deepIce = mix(iceBase, vec3(0.1, 0.35, 0.7), 1.0 - crystal);

  // Rim light — bright cyan that blooms
  vec3 rimColor = vec3(0.0, 0.85, 1.0) * fresnel * 3.0;
  vec3 color = deepIce + rimColor;

  // Subsurface scatter hint (faint blue glow from within)
  float sss = snoise(vUv * 5.0 + time * 0.01) * 0.5 + 0.5;
  color += vec3(0.0, 0.4, 0.8) * sss * 0.15;

  gl_FragColor = vec4(color, 1.0);
}
