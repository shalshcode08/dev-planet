import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSpaceStore } from '@/store/useSpaceStore'

function cubicBezier(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number): Vector3 {
  const mt = 1 - t
  return p0.clone()
    .multiplyScalar(mt * mt * mt)
    .add(p1.clone().multiplyScalar(3 * mt * mt * t))
    .add(p2.clone().multiplyScalar(3 * mt * t * t))
    .add(p3.clone().multiplyScalar(t * t * t))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

interface FlightState {
  active: boolean
  t: number
  duration: number
  p0: Vector3
  p1: Vector3
  p2: Vector3
  p3: Vector3
  startFov: number
  targetFov: number
  lookAt: Vector3
}

export function useCameraFlight() {
  const { camera } = useThree()
  const setAnimating = useSpaceStore((s) => s.setAnimating)
  const flightRef = useRef<FlightState | null>(null)
  const onCompleteRef = useRef<(() => void) | null>(null)

  const flyTo = useCallback(
    (targetPos: Vector3, lookAt: Vector3, duration = 2.5, onComplete?: () => void) => {
      const currentPos = camera.position.clone()
      const dist = currentPos.distanceTo(targetPos)
      const sweepHeight = dist * 0.5

      const cp1 = currentPos.clone().add(new Vector3(0, sweepHeight, 0))
      const cp2 = targetPos.clone().add(new Vector3(0, sweepHeight * 0.5, 0))

      const currentFov = (camera as { fov: number }).fov ?? 60
      flightRef.current = {
        active: true,
        t: 0,
        duration,
        p0: currentPos,
        p1: cp1,
        p2: cp2,
        p3: targetPos,
        startFov: currentFov,
        targetFov: 45,
        lookAt,
      }
      onCompleteRef.current = onComplete ?? null
      setAnimating(true)
    },
    [camera, setAnimating]
  )

  const flyBack = useCallback(
    (targetPos: Vector3, onComplete?: () => void) => {
      const currentPos = camera.position.clone()
      const dist = currentPos.distanceTo(targetPos)
      const sweepHeight = dist * 0.4

      const cp1 = currentPos.clone().add(new Vector3(0, sweepHeight, 0))
      const cp2 = targetPos.clone().add(new Vector3(0, sweepHeight * 0.3, 0))
      const currentFov = (camera as { fov: number }).fov ?? 45

      flightRef.current = {
        active: true,
        t: 0,
        duration: 2.0,
        p0: currentPos,
        p1: cp1,
        p2: cp2,
        p3: targetPos,
        startFov: currentFov,
        targetFov: 60,
        lookAt: new Vector3(0, 0, 0),
      }
      onCompleteRef.current = onComplete ?? null
      setAnimating(true)
    },
    [camera, setAnimating]
  )

  useFrame((_, delta) => {
    const f = flightRef.current
    if (!f || !f.active) return

    f.t = Math.min(f.t + delta / f.duration, 1)

    // Ease in-out cubic
    const ease = f.t < 0.5 ? 4 * f.t * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 3) / 2

    const pos = cubicBezier(f.p0, f.p1, f.p2, f.p3, ease)
    camera.position.copy(pos)

    // FOV zoom
    const cam = camera as { fov: number; updateProjectionMatrix: () => void }
    cam.fov = lerp(f.startFov, f.targetFov, ease)
    cam.updateProjectionMatrix()

    // Camera roll ±5° at mid-flight
    const roll = Math.sin(ease * Math.PI) * 0.087 // ~5 degrees
    camera.rotation.z = roll

    camera.lookAt(f.lookAt)

    if (f.t >= 1) {
      f.active = false
      camera.rotation.z = 0
      setAnimating(false)
      if (onCompleteRef.current) {
        onCompleteRef.current()
        onCompleteRef.current = null
      }
    }
  })

  return { flyTo, flyBack }
}
