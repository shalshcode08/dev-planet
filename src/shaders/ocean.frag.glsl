#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Wave pattern using sine + noise
  float wave1 = sin(vUv.x * 18.0 + time * 1.2) * 0.5 + 0.5;
  float wave2 = sin(vUv.y * 12.0 - time * 0.8) * 0.5 + 0.5;
  float foam = snoise(vUv * 10.0 + time * 0.15) * 0.5 + 0.5;
  float depth = snoise(vUv * 4.0 - time * 0.05) * 0.5 + 0.5;

  vec3 deepBlue = vec3(0.02, 0.1, 0.35);
  vec3 midBlue  = vec3(0.05, 0.3, 0.65);
  vec3 shallows = vec3(0.1, 0.55, 0.8);
  vec3 foamCol  = vec3(0.7, 0.88, 1.0);

  float t = depth * 0.7 + wave1 * 0.15 + wave2 * 0.15;
  vec3 color = mix(deepBlue, midBlue, smoothstep(0.2, 0.6, t));
  color = mix(color, shallows, smoothstep(0.6, 0.8, t));
  color = mix(color, foamCol, smoothstep(0.82, 0.95, foam) * 0.3);

  // Specular highlight
  vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
  float spec = pow(max(dot(reflect(-lightDir, normalize(vNormal)), normalize(vViewDir)), 0.0), 64.0);
  color += vec3(0.6, 0.85, 1.0) * spec * 0.8;

  // Land masses — brownish-green patches
  float land = snoise(vUv * 3.5 + 1.7) * 0.5 + 0.5;
  vec3 landColor = mix(vec3(0.15, 0.25, 0.1), vec3(0.3, 0.4, 0.2), snoise(vUv * 12.0) * 0.5 + 0.5);
  color = mix(color, landColor, step(0.62, land) * 0.9);

  gl_FragColor = vec4(color, 1.0);
}
