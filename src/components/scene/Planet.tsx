import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Mesh } from 'three'
import { useSpaceStore, type EnrichedRepo } from '@/store/useSpaceStore'
import '@/materials/LavaMaterial'
import '@/materials/GasMaterial'
import '@/materials/IceMaterial'
import '@/materials/OceanMaterial'
import '@/materials/DesertMaterial'

interface PlanetProps {
  config: EnrichedRepo
  worldPosition: [number, number, number]
  onSelect: (id: string, worldPos: [number, number, number]) => void
}

const SEGMENTS_NEAR = 64

export function Planet({ config, worldPosition, onSelect }: PlanetProps) {
  const meshRef = useRef<Mesh>(null)
  const matRef = useRef<{ time: number }>(null)
  const setHovered = useSpaceStore((s) => s.setHoveredPlanet)
  const hoveredId = useSpaceStore((s) => s.hoveredPlanetId)
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const isHovered = hoveredId === config.fullName
  const isSelected = selectedId === config.fullName

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.time += delta
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3
  })

  const handlePointerOver = useCallback(() => {
    setHovered(config.fullName)
    document.body.style.cursor = 'crosshair'
  }, [config.fullName, setHovered])

  const handlePointerOut = useCallback(() => {
    setHovered(null)
    document.body.style.cursor = 'default'
  }, [setHovered])

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onSelect(config.fullName, worldPosition)
    },
    [config.fullName, worldPosition, onSelect]
  )

  const size = config.planetSize * (isHovered ? 1.06 : 1)
  const segs = SEGMENTS_NEAR
  const labelVisible = isHovered || isSelected
  const labelColor = isSelected ? '#00ffaa' : '#00ccff'

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
    <group>
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
      
      {/* Floating label above planet */}
      {labelVisible && (
        <Html
          position={[worldPosition[0], worldPosition[1] + size + 0.8, worldPosition[2]]}
          center
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            opacity: labelVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
            fontFamily: '"Share Tech Mono", monospace',
            color: labelColor,
            fontSize: isSelected ? '0.75rem' : '0.65rem',
            letterSpacing: '0.1em',
            textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)',
            background: 'rgba(0, 10, 20, 0.5)',
            border: `1px solid ${labelColor}40`,
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            backdropFilter: 'blur(2px)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            transform: 'translateY(-10px)',
          }}
        >
          {isSelected ? (
            <span style={{ color: '#00ffaa' }}>● {config.name}</span>
          ) : (
            config.name
          )}
        </Html>
      )}
    </group>
  )
}
