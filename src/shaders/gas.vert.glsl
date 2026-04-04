varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  
  // Calculate view direction
  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-viewPos.xyz);
  
  gl_Position = projectionMatrix * viewPos;
}
