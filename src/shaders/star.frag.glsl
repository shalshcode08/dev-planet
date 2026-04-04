#include ./noise.glsl

uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

// Simplex 3D Noise function mapping 3D pos to float
float noise(vec3 p) {
    return snoise(p) * 0.5 + 0.5;
}

// FBM (Fractal Brownian Motion) for highly detailed, organic textures
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
  float t = time * 0.1;
  vec3 p = vNormal * 2.0; // Use normal for seamless 3D spherical mapping

  // Base domain warp to create turbulent flow lines
  vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0, t * 0.5)),
      fbm(p + vec3(5.2, 1.3, t * 0.2)),
      fbm(p + vec3(1.1, 7.8, t * 0.4))
  );

  // Second domain warp for fine plasma tendrils
  vec3 r = vec3(
      fbm(p + 4.0 * q + vec3(1.7, 9.2, t * 0.8)),
      fbm(p + 4.0 * q + vec3(8.3, 2.8, t * 0.5)),
      fbm(p + 4.0 * q + vec3(3.5, 4.4, t * 0.6))
  );

  // Final noise value evaluating the warped space
  float f = fbm(p + 6.0 * r);

  // Solar color palette mapping (from dark red plasma to blinding white-yellow)
  vec3 col = vec3(0.0);
  col = mix(vec3(0.3, 0.0, 0.0), vec3(0.9, 0.2, 0.0), smoothstep(0.0, 0.4, f)); // Dark red to orange
  col = mix(col, vec3(1.0, 0.6, 0.0), smoothstep(0.4, 0.7, f));                 // Orange to yellow
  col = mix(col, vec3(1.0, 0.95, 0.6), smoothstep(0.7, 1.0, f));                // Yellow to bright white

  // 3D Spherical Shading (Fresnel Limb Darkening)
  // This makes the sphere look volumetric and glowing, instead of a flat 2D circle
  float fresnel = dot(normalize(vNormal), normalize(vViewDir));
  fresnel = clamp(fresnel, 0.0, 1.0);

  // The edges (limb) get darker and redder
  vec3 edgeColor = vec3(0.5, 0.1, 0.0);
  col = mix(edgeColor, col, pow(fresnel, 0.6));

  // The very center facing the camera blooms blindingly white
  col += vec3(1.0, 0.9, 0.7) * pow(fresnel, 4.0) * 0.5;

  // Final bloom multiplier
  col *= 2.0;

  gl_FragColor = vec4(col, 1.0);
}
