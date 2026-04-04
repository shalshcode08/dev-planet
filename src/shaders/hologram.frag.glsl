#include ./noise.glsl

uniform float time;
uniform float opacity;
uniform float glitchAmount;
varying vec2 vUv;

void main() {
  // Scanlines moving downward
  float scanline = sin(vUv.y * 120.0 + time * 4.0) * 0.08 + 0.92;

  // Edge glow — brighter at panel borders
  float edge = (1.0 - vUv.x) * vUv.x * (1.0 - vUv.y) * vUv.y * 16.0;
  edge = clamp(edge, 0.0, 1.0);

  // Grid lines
  float gridX = step(0.96, fract(vUv.x * 28.0));
  float gridY = step(0.96, fract(vUv.y * 18.0));
  float grid = clamp(gridX + gridY, 0.0, 1.0);

  // Glitch noise
  float noise = snoise(vec3(vUv * 50.0, time * 8.0)) * glitchAmount;
  float glitch = step(0.97, snoise(vec3(vUv.y * 80.0, time * 6.0, 0.0)) + noise);
  vec2 glitchUv = vUv + vec2(glitch * 0.03 * noise, 0.0);

  // Horizontal glitch tear
  float tear = step(0.98, snoise(vec3(glitchUv.y * 200.0, time * 10.0, 0.5)));

  vec3 holoColor = vec3(0.08, 0.85, 1.0);
  float intensity = scanline + grid * 0.4 + edge * 0.6 + tear * 0.3;
  holoColor *= intensity;

  // Color aberration on glitch
  holoColor.r += glitch * 0.3;
  holoColor.b -= glitch * 0.1;

  float alpha = opacity * edge * 2.5;
  alpha = clamp(alpha, 0.0, 0.92);

  gl_FragColor = vec4(holoColor, alpha);
}
