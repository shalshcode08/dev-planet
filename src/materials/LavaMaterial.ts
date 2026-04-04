import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/lava.vert.glsl'
import fragmentShader from '@/shaders/lava.frag.glsl'

export const LavaMaterial = shaderMaterial(
  { time: 0, emissiveIntensity: 1.5 },
  vertexShader,
  fragmentShader
)

extend({ LavaMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    lavaMaterial: React.RefAttributes<typeof LavaMaterial> & {
      time?: number
      emissiveIntensity?: number
    }
  }
}
