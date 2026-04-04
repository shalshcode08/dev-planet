import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/ocean.vert.glsl'
import fragmentShader from '@/shaders/ocean.frag.glsl'

export const OceanMaterial = shaderMaterial(
  { time: 0 },
  vertexShader,
  fragmentShader
)

extend({ OceanMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    oceanMaterial: React.RefAttributes<typeof OceanMaterial> & {
      time?: number
    }
  }
}
