import { useRef, useCallback, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useSpaceStore } from '@/store/useSpaceStore'
import { CentralStar } from './CentralStar'
import { PlanetOrbit } from './PlanetOrbit'
import { AsteroidBelt } from './AsteroidBelt'
import { StarField } from './StarField'
import { GalaxyBackground } from './GalaxyBackground'
import { ShootingStars } from './ShootingStars'
import { CoordinateUpdater } from '@/components/hud/CoordinateDisplay'
import { useCameraFlight } from '@/hooks/useCameraFlight'

const HOME_POS = new Vector3(0, 15, 55)

export function SolarSystem() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const setSelected = useSpaceStore((s) => s.setSelectedPlanet)
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const isAnimating = useSpaceStore((s) => s.isAnimating)
  const enrichedRepos = useSpaceStore((s) => s.enrichedRepos)
  const { flyTo, flyBack } = useCameraFlight()

  useEffect(() => {
    camera.position.copy(HOME_POS)
  }, [camera])

  const handlePlanetSelect = useCallback(
    (id: string, worldPos: [number, number, number]) => {
      if (isAnimating) return

      const target = new Vector3(...worldPos)
      const dir = target.clone().normalize()
      
      const rightDir = new Vector3(0, 1, 0).cross(dir).normalize()
      
      const approachPos = target.clone().sub(dir.multiplyScalar(7)).add(new Vector3(0, 2, 0))
      const lookTarget = target.clone().add(rightDir.multiplyScalar(2.5))

      setSelected(id)
      flyTo(approachPos, lookTarget, 2.5, () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(lookTarget)
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

      <GalaxyBackground />
      <StarField />
      <ShootingStars />

      <CentralStar />

      {enrichedRepos.map((repo) => (
        <PlanetOrbit key={repo.id} config={repo} onSelect={handlePlanetSelect} />
      ))}

      <AsteroidBelt />

      <mesh
        position={[0, 0, 0]}
        onClick={handleDeselect}
        visible={false}
      >
        <sphereGeometry args={[200, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}
