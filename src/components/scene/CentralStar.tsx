import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Mesh } from 'three'
import '@/materials/StarMaterial'

export function CentralStar() {
  const coreRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)
  const outerRef = useRef<Mesh>(null)
  const matRef = useRef<{ time: number }>(null)

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.time += delta
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.05
    if (glowRef.current) glowRef.current.rotation.y -= delta * 0.02
    if (outerRef.current) outerRef.current.rotation.x += delta * 0.01
  })

  return (
    <group>
      {/* Point light — illuminates all planets */}
      <pointLight intensity={6} distance={300} decay={1.2} color="#fff6e0" />
      <pointLight intensity={2} distance={60} decay={2} color="#ff8800" />

      {/* Core star sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[2.8, 64, 64]} />
        {/* @ts-expect-error custom material */}
        <starMaterial ref={matRef} />
      </mesh>

      {/* Sparkle corona */}
      <Sparkles
        count={80}
        scale={10}
        size={4}
        speed={0.2}
        color="#ffaa44"
        opacity={0.6}
      />
    </group>
  )
}
