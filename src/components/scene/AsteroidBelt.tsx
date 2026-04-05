import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Matrix4, Quaternion, Vector3, Euler } from 'three'

const COUNT = 400
const INNER = 26
const OUTER = 30

export function AsteroidBelt() {
  const meshRef = useRef<InstancedMesh>(null)

  const data = useMemo(() => {
    return Array.from({ length: COUNT }, () => {
      const angle = Math.random() * Math.PI * 2
      const r = INNER + Math.random() * (OUTER - INNER)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = (Math.random() - 0.5) * 2
      const scale = 0.05 + Math.random() * 0.25
      const rotSpeed = (Math.random() - 0.5) * 0.5
      return { x, y, z, scale, rotSpeed, angle, r }
    })
  }, [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const matrix = new Matrix4()
    const q = new Quaternion()
    for (let i = 0; i < COUNT; i++) {
      const d = data[i]
      matrix.compose(
        new Vector3(d.x, d.y, d.z),
        q.setFromEuler(new Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)),
        new Vector3(d.scale, d.scale, d.scale)
      )
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [data])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const matrix = new Matrix4()
    const pos = new Vector3()
    const q = new Quaternion()
    const scale = new Vector3()
    for (let i = 0; i < COUNT; i++) {
      const d = data[i]
      d.angle += delta * 0.015
      const x = Math.cos(d.angle) * d.r
      const z = Math.sin(d.angle) * d.r
      mesh.getMatrixAt(i, matrix)
      matrix.decompose(pos, q, scale)
      pos.set(x, d.y, z)
      matrix.compose(pos, q, scale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#6b615c" roughness={1} metalness={0.05} flatShading />
    </instancedMesh>
  )
}