import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/star.vert.glsl'
import fragmentShader from '@/shaders/star.frag.glsl'

export const StarMaterial = shaderMaterial(
  { time: 0 },
  vertexShader,
  fragmentShader
)

extend({ StarMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    starMaterial: React.RefAttributes<typeof StarMaterial> & {
      time?: number
    }
  }
}
