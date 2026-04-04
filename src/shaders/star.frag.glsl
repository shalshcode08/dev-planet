#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Solar granulation
  float gran = snoise(vUv * 12.0 + time * 0.05) * 0.5 + 0.5;
  float gran2 = snoise(vUv * 30.0 - time * 0.08) * 0.5 + 0.5;
  float surface = gran * 0.7 + gran2 * 0.3;

  // Radial gradient — hotter at center
  vec2 center = vUv - 0.5;
  float radial = 1.0 - length(center) * 2.0;
  radial = clamp(radial, 0.0, 1.0);

  vec3 corona  = vec3(1.0, 0.95, 0.4);
  vec3 hot     = vec3(1.0, 0.8, 0.1);
  vec3 mid     = vec3(1.0, 0.5, 0.02);
  vec3 sunspot = vec3(0.4, 0.15, 0.0);

  vec3 color = mix(mid, hot, surface);
  color = mix(color, corona, radial * 0.6);
  color = mix(color, sunspot, smoothstep(0.6, 0.9, 1.0 - surface) * (1.0 - radial) * 0.5);

  // Solar flare streaks
  float flare = snoise(vec2(atan(center.y, center.x) * 2.0, time * 0.3)) * 0.5 + 0.5;
  color += vec3(1.0, 0.7, 0.1) * flare * radial * 0.4;

  // Strong emissive — everything glows
  color *= 2.5;

  gl_FragColor = vec4(color, 1.0);
}
