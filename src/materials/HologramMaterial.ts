import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import vertexShader from '@/shaders/hologram.vert.glsl'
import fragmentShader from '@/shaders/hologram.frag.glsl'

export const HologramMaterial = shaderMaterial(
  { time: 0, opacity: 1.0, glitchAmount: 0.0 },
  vertexShader,
  fragmentShader
)

extend({ HologramMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    hologramMaterial: React.RefAttributes<typeof HologramMaterial> & {
      time?: number
      opacity?: number
      glitchAmount?: number
      transparent?: boolean
      depthWrite?: boolean
    }
  }
}
