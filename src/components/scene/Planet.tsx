import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import { useSpaceStore } from '@/store/useSpaceStore'
import type { ProjectConfig } from '@/data/projects'
import '@/materials/LavaMaterial'
import '@/materials/GasMaterial'
import '@/materials/IceMaterial'
import '@/materials/OceanMaterial'
import '@/materials/DesertMaterial'

interface PlanetProps {
  config: ProjectConfig
  worldPosition: [number, number, number]
  onSelect: (id: string, worldPos: [number, number, number]) => void
}

const SEGMENTS_NEAR = 64

export function Planet({ config, worldPosition, onSelect }: PlanetProps) {
  const meshRef = useRef<Mesh>(null)
  const matRef = useRef<{ time: number }>(null)
  const setHovered = useSpaceStore((s) => s.setHoveredPlanet)
  const hoveredId = useSpaceStore((s) => s.hoveredPlanetId)
  const isHovered = hoveredId === config.id

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.time += delta
    // Self-rotation
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
  })

  const handlePointerOver = useCallback(() => {
    setHovered(config.id)
    document.body.style.cursor = 'crosshair'
  }, [config.id, setHovered])

  const handlePointerOut = useCallback(() => {
    setHovered(null)
    document.body.style.cursor = 'default'
  }, [setHovered])

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onSelect(config.id, worldPosition)
    },
    [config.id, worldPosition, onSelect]
  )

  const size = config.planetSize * (isHovered ? 1.06 : 1)
  const segs = SEGMENTS_NEAR

  const renderMaterial = () => {
    switch (config.planetType) {
      case 'lava':
        // @ts-expect-error custom material
        return <lavaMaterial ref={matRef} emissiveIntensity={1.5} />
      case 'gas':
        // @ts-expect-error custom material
        return <gasMaterial ref={matRef} />
      case 'ice':
        // @ts-expect-error custom material
        return <iceMaterial ref={matRef} />
      case 'ocean':
        // @ts-expect-error custom material
        return <oceanMaterial ref={matRef} />
      case 'desert':
        // @ts-expect-error custom material
        return <desertMaterial ref={matRef} />
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={worldPosition}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[size, segs, segs]} />
      {renderMaterial()}
    </mesh>
  )
}
