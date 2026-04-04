#include ./noise.glsl

uniform float time;
uniform vec3 colorA;
uniform vec3 colorB;
uniform vec3 colorC;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  // Swirling horizontal turbulent bands
  float warp = snoise(vec2(vUv.x * 3.0, vUv.y * 1.5 + time * 0.04)) * 0.3;
  float band = snoise(vec2(vUv.x * 2.0 + warp, (vUv.y + warp) * 4.0 + time * 0.02));
  float detail = snoise(vec2(vUv.x * 8.0, vUv.y * 8.0 - time * 0.06)) * 0.15;
  float t = band * 0.5 + 0.5 + detail;

  vec3 color = mix(colorA, colorB, smoothstep(0.2, 0.6, t));
  color = mix(color, colorC, smoothstep(0.6, 0.9, t));

  // Storm spot
  vec2 stormUv = vUv - vec2(0.3, 0.5);
  float storm = 1.0 - smoothstep(0.0, 0.12, length(stormUv));
  color = mix(color, vec3(1.0, 0.9, 0.7), storm * 0.5);

  // Lighting
  vec3 lightDir = normalize(-vWorldPos);
  float diff = max(dot(normalize(vNormal), lightDir), 0.0);
  float ambient = 0.05;
  
  // Soft rim light for gas giants
  float rim = 1.0 - max(dot(normalize(vViewDir), normalize(vNormal)), 0.0);
  rim = smoothstep(0.6, 1.0, rim);
  
  color = color * (diff + ambient) + vec3(0.2, 0.4, 0.8) * rim * diff * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
