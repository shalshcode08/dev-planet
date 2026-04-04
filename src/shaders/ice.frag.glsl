#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  // Fresnel rim glow
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 3.0);

  // Crystalline crack pattern
  float cracks = snoise(vUv * 20.0 + time * 0.005) * 0.5 + 0.5;
  float fineCracks = snoise(vUv * 50.0) * 0.5 + 0.5;
  float crystal = mix(cracks, fineCracks, 0.4);

  vec3 iceBase = mix(vec3(0.72, 0.90, 1.0), vec3(0.85, 0.96, 1.0), crystal);
  vec3 deepIce = mix(iceBase, vec3(0.1, 0.35, 0.7), 1.0 - crystal);

  // Lighting relative to central star
  vec3 lightDir = normalize(-vWorldPos);
  float diff = max(dot(normalize(vNormal), lightDir), 0.0);
  float ambient = 0.1;

  // Rim light — bright cyan that blooms on the lit side
  vec3 rimColor = vec3(0.0, 0.85, 1.0) * fresnel * 2.0 * diff;
  vec3 color = (deepIce * (diff + ambient)) + rimColor;

  // Subsurface scatter hint (faint blue glow from within on lit side)
  float sss = snoise(vUv * 5.0 + time * 0.01) * 0.5 + 0.5;
  color += vec3(0.0, 0.4, 0.8) * sss * 0.3 * (diff + 0.2);

  // Specular reflection of the sun
  vec3 viewDirWorld = normalize(cameraPosition - vWorldPos);
  vec3 halfVector = normalize(lightDir + viewDirWorld);
  float spec = pow(max(dot(normalize(vNormal), halfVector), 0.0), 48.0) * step(0.0, diff);
  color += vec3(0.9, 0.95, 1.0) * spec * 1.5;

  gl_FragColor = vec4(color, 1.0);
}
