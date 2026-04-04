import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { Color } from 'three'
import vertexShader from '@/shaders/gas.vert.glsl'
import fragmentShader from '@/shaders/gas.frag.glsl'

export const GasMaterial = shaderMaterial(
  {
    time: 0,
    colorA: new Color(0.6, 0.3, 0.1),
    colorB: new Color(0.9, 0.55, 0.2),
    colorC: new Color(0.7, 0.45, 0.3),
  },
  vertexShader,
  fragmentShader
)

extend({ GasMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    gasMaterial: React.RefAttributes<typeof GasMaterial> & {
      time?: number
      colorA?: Color
      colorB?: Color
      colorC?: Color
    }
  }
}
