#include ./noise.glsl

uniform float time;
uniform float emissiveIntensity;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  // Two-layer noise for lava crack pattern
  float n1 = snoise(vUv * 6.0 + vec2(time * 0.08, time * 0.04));
  float n2 = snoise(vUv * 12.0 + vec2(time * 0.05, -time * 0.03));
  float crack = n1 - n2 * 0.5;
  crack = crack * 0.5 + 0.5;

  // Dark rock base with glowing cracks
  vec3 rock = mix(vec3(0.05, 0.02, 0.01), vec3(0.15, 0.05, 0.02), snoise(vUv * 8.0) * 0.5 + 0.5);
  vec3 lava = mix(vec3(0.8, 0.12, 0.0), vec3(1.0, 0.65, 0.05), smoothstep(0.55, 0.85, crack));
  vec3 color = mix(rock, lava, smoothstep(0.45, 0.65, crack));

  // Emissive glow on hot cracks — picked up by Bloom
  float glow = smoothstep(0.6, 0.9, crack);
  color += glow * vec3(1.0, 0.4, 0.0) * emissiveIntensity * 2.5;

  // Subtle normal-based darkening on edges
  float rim = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
  color *= 0.7 + 0.3 * rim;

  gl_FragColor = vec4(color, 1.0);
}
