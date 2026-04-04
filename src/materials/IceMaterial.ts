import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/ice.vert.glsl'
import fragmentShader from '@/shaders/ice.frag.glsl'

export const IceMaterial = shaderMaterial(
  { time: 0 },
  vertexShader,
  fragmentShader
)

extend({ IceMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    iceMaterial: React.RefAttributes<typeof IceMaterial> & {
      time?: number
    }
  }
}
