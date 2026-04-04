import { useRef, useCallback, useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useSpaceStore } from '@/store/useSpaceStore'
import { projects } from '@/data/projects'
import { CentralStar } from './CentralStar'
import { PlanetOrbit } from './PlanetOrbit'
import { AsteroidBelt } from './AsteroidBelt'
import { StarField } from './StarField'
import { GalaxyBackground } from './GalaxyBackground'
import { ShootingStars } from './ShootingStars'
import { HologramPanel } from '@/components/hologram/HologramPanel'
import { CoordinateUpdater } from '@/components/hud/CoordinateDisplay'
import { useCameraFlight } from '@/hooks/useCameraFlight'
import { useGitHubRepos } from '@/hooks/useGitHubRepos'

const HOME_POS = new Vector3(0, 15, 55)

export function SolarSystem() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const setSelected = useSpaceStore((s) => s.setSelectedPlanet)
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const isAnimating = useSpaceStore((s) => s.isAnimating)
  const { flyTo, flyBack } = useCameraFlight()

  const [hologramPos, setHologramPos] = useState<Vector3>(new Vector3(0, 0, 0))

  useGitHubRepos()

  // Set initial camera position
  useEffect(() => {
    camera.position.copy(HOME_POS)
  }, [camera])

  const handlePlanetSelect = useCallback(
    (id: string, worldPos: [number, number, number]) => {
      if (isAnimating) return

      const target = new Vector3(...worldPos)
      setHologramPos(target.clone())

      // Fly in close
      const dir = target.clone().normalize()
      const approachPos = target.clone().sub(dir.multiplyScalar(6)).add(new Vector3(0, 3, 0))

      setSelected(id)
      flyTo(approachPos, target, 2.5, () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(target)
        }
      })
    },
    [flyTo, isAnimating, setSelected]
  )

  const handleDeselect = useCallback(() => {
    if (!selectedId || isAnimating) return
    setSelected(null)
    flyBack(HOME_POS, () => {
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
      }
    })
  }, [flyBack, isAnimating, selectedId, setSelected])

  // Keyboard: Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDeselect()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDeselect])

  return (
    <>
      <CoordinateUpdater />

      {/* Controls — disabled during animation */}
      <OrbitControls
        ref={controlsRef}
        enabled={!isAnimating}
        enablePan={false}
        minDistance={8}
        maxDistance={120}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        onStart={() => {}}
      />

      {/* Background layers */}
      <GalaxyBackground />
      <StarField />
      <ShootingStars />

      {/* Scene */}
      <CentralStar />

      {projects.map((p) => (
        <PlanetOrbit key={p.id} config={p} onSelect={handlePlanetSelect} />
      ))}

      <AsteroidBelt />

      {/* Click on empty space = deselect */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleDeselect}
        visible={false}
      >
        <sphereGeometry args={[200, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* Hologram panel when planet selected */}
      {selectedId && <HologramPanel planetWorldPos={hologramPos} />}
    </>
  )
}
