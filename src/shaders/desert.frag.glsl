#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;

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

  // Rim darkening
  float rim = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
  color *= 0.5 + 0.5 * rim;

  gl_FragColor = vec4(color, 1.0);
}
