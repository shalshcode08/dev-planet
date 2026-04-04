import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/desert.vert.glsl'
import fragmentShader from '@/shaders/desert.frag.glsl'

export const DesertMaterial = shaderMaterial(
  { time: 0 },
  vertexShader,
  fragmentShader
)

extend({ DesertMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    desertMaterial: React.RefAttributes<typeof DesertMaterial> & {
      time?: number
    }
  }
}
