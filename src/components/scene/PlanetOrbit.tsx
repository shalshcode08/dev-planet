import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Group } from 'three'
import { useSpaceStore, type EnrichedRepo } from '@/store/useSpaceStore'
import { Planet } from './Planet'

interface PlanetOrbitProps {
  config: EnrichedRepo
  onSelect: (id: string, worldPos: [number, number, number]) => void
}

function buildOrbitPoints(radius: number, tilt: number, segments = 128) {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const x = Math.cos(a) * radius
    const z = Math.sin(a) * radius
    const y = Math.sin(a) * radius * Math.sin(tilt)
    pts.push([x, y * 0.05, z])
  }
  return pts
}

export function PlanetOrbit({ config, onSelect }: PlanetOrbitProps) {
  const groupRef = useRef<Group>(null)
  const angleRef = useRef(config.initialAngle)
  const isAnimating = useSpaceStore((s) => s.isAnimating)
  const turboMode = useSpaceStore((s) => s.turboMode)
  const [worldPos, setWorldPos] = useState<[number, number, number]>([
    Math.cos(config.initialAngle) * config.orbitRadius,
    0,
    Math.sin(config.initialAngle) * config.orbitRadius,
  ])

  const orbitPoints = buildOrbitPoints(config.orbitRadius, config.orbitTilt)

  useFrame((_, delta) => {
    if (isAnimating) return
    angleRef.current += delta * config.orbitSpeed * (turboMode ? 5 : 1)
    const a = angleRef.current
    const x = Math.cos(a) * config.orbitRadius
    const z = Math.sin(a) * config.orbitRadius
    const y = Math.sin(a) * config.orbitRadius * config.orbitTilt * 0.05
    setWorldPos([x, y, z])
  })

  return (
    <group ref={groupRef}>
      <Line
        points={orbitPoints}
        color="#334466"
        lineWidth={0.5}
        transparent
        opacity={0.35}
      />
      <Planet config={config} worldPosition={worldPos} onSelect={onSelect} />
    </group>
  )
}
