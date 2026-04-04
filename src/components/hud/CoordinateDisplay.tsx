import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useSpaceStore } from '@/store/useSpaceStore'

const SECTORS = ['7G', '4B', '12F', '9A', '3D', '6K', '11C', '2H']

export function CoordinateUpdater() {
  const { camera } = useThree()
  const setFakeCoords = useSpaceStore((s) => s.setFakeCoords)

  useEffect(() => {
    let sector = '7G'
    const id = setInterval(() => {
      const x = camera.position.x
      const y = camera.position.y
      const z = camera.position.z
      // Change sector when far from origin
      const dist = Math.sqrt(x * x + y * y + z * z)
      if (dist > 60) sector = SECTORS[Math.floor(dist / 20) % SECTORS.length]
      else sector = '7G'
      setFakeCoords({
        x: parseFloat((x + (Math.random() - 0.5) * 0.3).toFixed(2)),
        y: parseFloat((y + (Math.random() - 0.5) * 0.2).toFixed(2)),
        z: parseFloat((z + (Math.random() - 0.5) * 0.3).toFixed(2)),
        sector,
      })
    }, 120)
    return () => clearInterval(id)
  }, [camera, setFakeCoords])

  return null
}
