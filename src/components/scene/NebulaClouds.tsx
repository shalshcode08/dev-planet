import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, AdditiveBlending, CanvasTexture } from 'three'

// Box-Muller: standard normal random sample
function gauss(mean: number, sigma: number) {
  const u1 = Math.max(1e-10, Math.random())
  const u2 = Math.random()
  return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function createSoftGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0,    'rgba(255,255,255,1.0)')
  g.addColorStop(0.15, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.4,  'rgba(255,255,255,0.4)')
  g.addColorStop(0.75, 'rgba(255,255,255,0.1)')
  g.addColorStop(1.0,  'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new CanvasTexture(canvas)
}

// Each cloud: center position, particle count, color palette, spread
const CLOUDS = [
  {
    // Purple / violet — upper right background
    center: [160, 30, -220] as [number, number, number],
    count: 700,
    spread: [55, 28, 40] as [number, number, number],
    colors: [
      [0.55, 0.08, 0.85],  // deep violet
      [0.40, 0.05, 0.70],  // purple
      [0.65, 0.10, 0.90],  // bright violet
      [0.30, 0.05, 0.60],  // dark purple
    ],
    sizeRange: [55, 95] as [number, number],
  },
  {
    // Teal / deep cyan — lower left
    center: [-190, -25, -180] as [number, number, number],
    count: 650,
    spread: [50, 22, 45] as [number, number, number],
    colors: [
      [0.02, 0.55, 0.75],  // teal
      [0.05, 0.65, 0.85],  // bright teal
      [0.00, 0.40, 0.60],  // deep teal
      [0.08, 0.70, 0.80],  // cyan-teal
    ],
    sizeRange: [50, 85] as [number, number],
  },
  {
    // Rose / pink — upper left
    center: [-140, 55, -260] as [number, number, number],
    count: 550,
    spread: [42, 20, 35] as [number, number, number],
    colors: [
      [0.80, 0.10, 0.35],  // deep rose
      [0.90, 0.15, 0.45],  // rose
      [0.70, 0.08, 0.30],  // dark magenta
      [0.85, 0.20, 0.50],  // bright rose
    ],
    sizeRange: [45, 80] as [number, number],
  },
  {
    // Amber / golden — far right accent (sparser)
    center: [280, -10, -140] as [number, number, number],
    count: 300,
    spread: [35, 16, 28] as [number, number, number],
    colors: [
      [0.80, 0.45, 0.05],  // amber
      [0.70, 0.35, 0.02],  // dark amber
      [0.85, 0.55, 0.08],  // golden
    ],
    sizeRange: [40, 70] as [number, number],
  },
]

export function NebulaClouds() {
  // One Points object per cloud for color control
  const refs = [
    useRef<Points>(null),
    useRef<Points>(null),
    useRef<Points>(null),
    useRef<Points>(null),
  ]

  const glowTex = useMemo(() => createSoftGlowTexture(), [])

  const cloudData = useMemo(() =>
    CLOUDS.map((cloud) => {
      const pos = new Float32Array(cloud.count * 3)
      const col = new Float32Array(cloud.count * 3)
      const siz = new Float32Array(cloud.count)

      for (let i = 0; i < cloud.count; i++) {
        // Gaussian cluster — tighter density at center
        pos[i * 3]     = gauss(cloud.center[0], cloud.spread[0])
        pos[i * 3 + 1] = gauss(cloud.center[1], cloud.spread[1])
        pos[i * 3 + 2] = gauss(cloud.center[2], cloud.spread[2])

        // Pick from palette with slight variation
        const palette = cloud.colors[Math.floor(Math.random() * cloud.colors.length)]
        const v = 0.85 + Math.random() * 0.3  // brightness variation
        col[i * 3]     = Math.min(1, palette[0] * v)
        col[i * 3 + 1] = Math.min(1, palette[1] * v)
        col[i * 3 + 2] = Math.min(1, palette[2] * v)

        // Size variation within range
        siz[i] = cloud.sizeRange[0] + Math.random() * (cloud.sizeRange[1] - cloud.sizeRange[0])
      }

      return { pos, col, siz }
    }),
  [])

  useFrame((_, delta) => {
    refs.forEach((ref) => {
      if (ref.current) ref.current.rotation.y += delta * 0.0008
    })
  })

  return (
    <>
      {CLOUDS.map((_, ci) => (
        <points key={ci} ref={refs[ci]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloudData[ci].pos, 3]} />
            <bufferAttribute attach="attributes-color"    args={[cloudData[ci].col, 3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={72}
            sizeAttenuation
            transparent
            opacity={0.11}
            depthWrite={false}
            blending={AdditiveBlending}
            map={glowTex}
            alphaTest={0.001}
            fog={false}
          />
        </points>
      ))}
    </>
  )
}
