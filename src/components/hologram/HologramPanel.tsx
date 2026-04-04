import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Vector3, Mesh, Group } from 'three'
import { useSpaceStore } from '@/store/useSpaceStore'
import { projects } from '@/data/projects'
import '@/materials/HologramMaterial'

interface HologramPanelProps {
  planetWorldPos: Vector3
}

export function HologramPanel({ planetWorldPos }: HologramPanelProps) {
  const panelRef = useRef<Mesh>(null)
  const matRef = useRef<{ time: number; opacity: number; glitchAmount: number }>(null)
  const { camera } = useThree()
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const githubData = useSpaceStore((s) => s.githubData)

  const config = projects.find((p) => p.id === selectedId)
  const repoKey = config?.githubRepo.toLowerCase()
  const repo = repoKey ? githubData[repoKey] : null

  const glitchRef = useRef(0)

  useEffect(() => {
    // Initial glitch burst on show
    glitchRef.current = 0.8
  }, [selectedId])

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.time += delta
      matRef.current.opacity = Math.min(matRef.current.opacity + delta * 2, 1)
      matRef.current.glitchAmount = Math.max(0, glitchRef.current - delta * 1.5)
      glitchRef.current = matRef.current.glitchAmount
    }
    if (panelRef.current) {
      // Face camera, slightly offset from planet
      const offset = new Vector3(3.5, 1.5, 0)
      panelRef.current.position.copy(planetWorldPos).add(offset)
      panelRef.current.lookAt(camera.position)
    }
  })

  if (!config) return null

  const name = repo?.name ?? config.id
  const desc = repo?.description ?? 'A project in the solar system'
  const lang = repo?.language ?? '—'
  const stars = repo?.stargazers_count ?? 0
  const topics = repo?.topics?.slice(0, 4).join('  ') ?? ''

  return (
    <group>
      {/* Panel background */}
      <mesh ref={panelRef}>
        <planeGeometry args={[5.5, 3.5]} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <hologramMaterial
          ref={matRef as any}
          transparent
          depthWrite={false}
          opacity={0}
        />
      </mesh>

      {/* Text rendered separately, positioned via useFrame in parent */}
      <PanelText
        name={name}
        desc={desc}
        lang={lang}
        stars={stars}
        topics={topics}
        planetPos={planetWorldPos}
        liveUrl={config.liveUrl}
        githubUrl={repo?.html_url}
      />
    </group>
  )
}

interface PanelTextProps {
  name: string
  desc: string
  lang: string
  stars: number
  topics: string
  planetPos: Vector3
  liveUrl?: string
  githubUrl?: string
}

function PanelText({ name, desc, lang, stars, topics, planetPos, liveUrl, githubUrl }: PanelTextProps) {
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (groupRef.current) {
      const offset = new Vector3(3.5, 1.5, 0)
      groupRef.current.position.copy(planetPos).add(offset)
      groupRef.current.lookAt(camera.position)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Project name */}
      <Text
        position={[0, 1.1, 0.02]}
        fontSize={0.36}
        color="#00ddff"
        font="/fonts/ShareTechMono-Regular.ttf"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.5}
      >
        {`> ${name.toUpperCase()}`}
      </Text>

      {/* Description */}
      <Text
        position={[0, 0.4, 0.02]}
        fontSize={0.155}
        color="#88ccdd"
        font="/fonts/ShareTechMono-Regular.ttf"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.8}
        textAlign="center"
      >
        {desc}
      </Text>

      {/* Stats row */}
      <Text
        position={[-1.2, -0.2, 0.02]}
        fontSize={0.17}
        color="#44ffaa"
        font="/fonts/ShareTechMono-Regular.ttf"
        anchorX="center"
        anchorY="middle"
      >
        {`★ ${stars}`}
      </Text>
      <Text
        position={[0.4, -0.2, 0.02]}
        fontSize={0.17}
        color="#ffaa44"
        font="/fonts/ShareTechMono-Regular.ttf"
        anchorX="center"
        anchorY="middle"
      >
        {lang}
      </Text>

      {/* Topics */}
      <Text
        position={[0, -0.6, 0.02]}
        fontSize={0.13}
        color="#336688"
        font="/fonts/ShareTechMono-Regular.ttf"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.8}
        textAlign="center"
      >
        {topics}
      </Text>

      {/* Links */}
      {githubUrl && (
        <Text
          position={[-1.0, -1.0, 0.02]}
          fontSize={0.145}
          color="#0088ff"
          font="/fonts/ShareTechMono-Regular.ttf"
          anchorX="center"
          anchorY="middle"
        >
          [GITHUB]
        </Text>
      )}
      {liveUrl && (
        <Text
          position={[1.0, -1.0, 0.02]}
          fontSize={0.145}
          color="#00ffaa"
          font="/fonts/ShareTechMono-Regular.ttf"
          anchorX="center"
          anchorY="middle"
        >
          [LIVE]
        </Text>
      )}
    </group>
  )
}
