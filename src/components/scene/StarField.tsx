import { useRef, useMemo } from 'react'
import { CanvasTexture } from 'three'
import { useFrame } from '@react-three/fiber'
import { Points } from 'three'

const STAR_COUNT = 8000


function createCircleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.beginPath()
    ctx.arc(32, 32, 30, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.shadowBlur = 8
    ctx.shadowColor = '#ffffff'
  }
  return new CanvasTexture(canvas)
}

export function StarField() {
  const circleTexture = useMemo(() => createCircleTexture(), [])

  const ref = useRef<Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 400 + Math.random() * 600
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  const sizes = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) arr[i] = Math.random() * 1.5 + 0.3
    return arr
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.003
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        sizeAttenuation
        color="#c8d8ff"
        transparent
        opacity={0.85}
        fog={false}
        map={circleTexture}
        alphaTest={0.01}
      />
    </points>
  )
}
