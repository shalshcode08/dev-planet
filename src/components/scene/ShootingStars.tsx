import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'

interface Streak {
  start: Vector3
  dir: Vector3
  speed: number
  t: number
  delay: number
  active: boolean
}

function randomStreak(): Streak {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 80 + Math.random() * 120
  const start = new Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  )
  const dir = start.clone().normalize().negate().add(
    new Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0)
  ).normalize()
  return { start, dir, speed: 30 + Math.random() * 50, t: 0, delay: Math.random() * 15, active: false }
}

const STREAK_COUNT = 8

export function ShootingStars() {
  const streaks = useRef<Streak[]>(Array.from({ length: STREAK_COUNT }, randomStreak))
  const linesRef = useRef<Array<{ points: [Vector3, Vector3] }>>(Array.from({ length: STREAK_COUNT }, (_, i) => ({
    points: [streaks.current[i].start.clone(), streaks.current[i].start.clone()],
  })))

  useFrame((_, delta) => {
    for (let i = 0; i < STREAK_COUNT; i++) {
      const s = streaks.current[i]
      if (!s.active) {
        s.delay -= delta
        if (s.delay <= 0) s.active = true
        continue
      }
      s.t += delta
      const traveled = s.t * s.speed
      const head = s.start.clone().addScaledVector(s.dir, traveled)
      const tail = s.start.clone().addScaledVector(s.dir, Math.max(0, traveled - 12))

      linesRef.current[i].points = [tail, head]

      if (traveled > 80) {
        // Reset
        const fresh = randomStreak()
        fresh.delay = 3 + Math.random() * 12
        streaks.current[i] = fresh
        linesRef.current[i].points = [fresh.start.clone(), fresh.start.clone()]
      }
    }
  })

  return (
    <>
      {linesRef.current.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color="white"
          lineWidth={1.5}
          transparent
          opacity={0.7}
        />
      ))}
    </>
  )
}
