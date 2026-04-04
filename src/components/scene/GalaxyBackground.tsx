import { useMemo } from 'react'
import { Color, AdditiveBlending } from 'three'

const CLOUD_COUNT = 3000

export function GalaxyBackground() {
  const positions = useMemo(() => {
    const arr = new Float32Array(CLOUD_COUNT * 3)
    const colors = new Float32Array(CLOUD_COUNT * 3)
    for (let i = 0; i < CLOUD_COUNT; i++) {
      // Disk distribution for milky-way look
      const arm = Math.floor(Math.random() * 3)
      const armAngle = (arm / 3) * Math.PI * 2
      const r = 200 + Math.random() * 500
      const theta = armAngle + (r / 500) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const spread = Math.random() * 30 * (1 - r / 700)
      arr[i * 3]     = Math.cos(theta) * r + (Math.random() - 0.5) * spread
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40
      arr[i * 3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * spread

      const c = new Color().setHSL(0.6 + Math.random() * 0.15, 0.5, 0.5 + Math.random() * 0.5)
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions: arr, colors }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[positions.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.5}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </points>
  )
}
