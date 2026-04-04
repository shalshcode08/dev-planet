#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  // Rocky, dusty surface
  float rock = snoise(vUv * 8.0) * 0.5 + 0.5;
  float dust = snoise(vUv * 20.0 + time * 0.01) * 0.5 + 0.5;
  float crater = snoise(vUv * 3.0 + 2.3) * 0.5 + 0.5;

  vec3 sandstone = vec3(0.65, 0.42, 0.2);
  vec3 darkRock  = vec3(0.28, 0.18, 0.08);
  vec3 dustCol   = vec3(0.75, 0.55, 0.32);

  vec3 color = mix(darkRock, sandstone, rock);
  color = mix(color, dustCol, dust * 0.35);

  // Crater depressions
  float craterEdge = smoothstep(0.45, 0.5, crater) * (1.0 - smoothstep(0.5, 0.55, crater));
  color = mix(color, darkRock * 0.5, craterEdge * 0.7);

  // Subtle dust storm streaks
  float streak = snoise(vec2(vUv.x * 2.0 + time * 0.02, vUv.y * 30.0)) * 0.5 + 0.5;
  color = mix(color, dustCol * 1.2, smoothstep(0.7, 0.9, streak) * 0.2);

  // Lighting
  vec3 lightDir = normalize(-vWorldPos);
  float diff = max(dot(normalize(vNormal), lightDir), 0.0);
  float ambient = 0.04;
  
  // Dust atmosphere scattering on the lit edge
  float fresnel = 1.0 - max(dot(normalize(vViewDir), normalize(vNormal)), 0.0);
  vec3 atmosphere = vec3(0.8, 0.6, 0.4) * pow(fresnel, 3.0) * diff;

  gl_FragColor = vec4(color * (diff + ambient) + atmosphere, 1.0);
}
