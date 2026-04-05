import { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

// ─── Shared game state (pure refs — zero React overhead in game loop) ─────────

interface GS {
  shipX: number; shipY: number
  velX:  number; velY:  number
  speed: number; score: number
  dead:  boolean; started: boolean
  keys:  Set<string>
}

function makeGS(): GS {
  return { shipX: 0, shipY: 0, velX: 0, velY: 0, speed: 1, score: 0, dead: false, started: false, keys: new Set() }
}

// ─── Modes ────────────────────────────────────────────────────────────────────

export type GameMode = 'easy' | 'normal' | 'hard' | 'expert'

export const MODES: Record<GameMode, {
  label: string; color: string; desc: string
  speedMult: number; spawnMult: number; sizeMult: number; maxSpeed: number
}> = {
  easy:   { label: 'EASY',   color: '#00ffaa', desc: 'Slow & forgiving',      speedMult: 0.60, spawnMult: 0.55, sizeMult: 0.85, maxSpeed: 8  },
  normal: { label: 'NORMAL', color: '#00ccff', desc: 'Balanced challenge',     speedMult: 1.00, spawnMult: 1.00, sizeMult: 1.00, maxSpeed: 16 },
  hard:   { label: 'HARD',   color: '#ffaa00', desc: 'Dense & fast',           speedMult: 1.55, spawnMult: 1.55, sizeMult: 1.10, maxSpeed: 22 },
  expert: { label: 'EXPERT', color: '#ff4444', desc: 'Maximum chaos',          speedMult: 2.40, spawnMult: 2.20, sizeMult: 0.80, maxSpeed: 30 },
}

// ─── Rock types ────────────────────────────────────────────────────────────────

interface Rock {
  id: number
  x: number; y: number; z: number
  rotX: number; rotY: number
  size: number; type: number
  rx: number; ry: number
  driftX: number; driftY: number
}

// ─── Engine Particle Trail ────────────────────────────────────────────────────
// InstancedMesh pool — zero allocation per frame

function EngineTrail({ gs }: { gs: React.MutableRefObject<GS> }) {
  const COUNT   = 120
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  const pool = useRef(
    Array.from({ length: COUNT }, () => ({
      x: 0, y: 0, z: 0,
      vz: 0, life: 0, maxLife: 0.35,
    }))
  )
  const emitTimer = useRef(0)

  useFrame((_, dt) => {
    if (!meshRef.current || gs.current.dead) return

    // Emit
    emitTimer.current += dt
    const emitInterval = 0.018
    while (emitTimer.current >= emitInterval) {
      emitTimer.current -= emitInterval
      const p = pool.current.find(p => p.life <= 0)
      if (p) {
        const side = Math.random() > 0.5 ? -0.38 : 0.38
        p.x = gs.current.shipX + side + (Math.random() - 0.5) * 0.15
        p.y = gs.current.shipY + (Math.random() - 0.5) * 0.12
        p.z = -0.55
        p.vz = -(4 + Math.random() * 3)
        p.maxLife = 0.28 + Math.random() * 0.18
        p.life    = p.maxLife
      }
    }

    // Update
    for (let i = 0; i < COUNT; i++) {
      const p = pool.current[i]
      if (p.life > 0) {
        p.life -= dt
        p.z    += p.vz * dt
        const t = p.life / p.maxLife
        const s = t * 0.11
        dummy.position.set(p.x, p.y, p.z)
        dummy.scale.setScalar(Math.max(0, s))
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        meshRef.current.setColorAt?.(i, new THREE.Color().setHSL(0.57, 1, 0.5 + t * 0.3))
      } else {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial color="#00aaff" transparent opacity={0.75} vertexColors />
    </instancedMesh>
  )
}


// ─── Tunnel Star Field ─────────────────────────────────────────────────────────
// Stars arranged in a cylinder flowing toward the camera — creates warp-tunnel feel

function TunnelStars({ gs }: { gs: React.MutableRefObject<GS> }) {
  const COUNT  = 600
  const geoRef = useRef<THREE.BufferGeometry>(null)

  const initPos = useMemo(() => {
    const a = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = 7 + Math.random() * 22
      const θ = Math.random() * Math.PI * 2
      a[i * 3]     = Math.cos(θ) * r
      a[i * 3 + 1] = Math.sin(θ) * r
      a[i * 3 + 2] = -100 + Math.random() * 115
    }
    return a
  }, [])

  const posRef = useRef(new Float32Array(initPos))

  useFrame((_, dt) => {
    const s   = gs.current.speed
    const pos = posRef.current
    const spd = (10 + s * 5) * dt
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 2] += spd
      if (pos[i * 3 + 2] > 14) {
        const r = 7 + Math.random() * 22
        const θ = Math.random() * Math.PI * 2
        pos[i * 3]     = Math.cos(θ) * r
        pos[i * 3 + 1] = Math.sin(θ) * r
        pos[i * 3 + 2] = -100
      }
    }
    if (geoRef.current)
      (geoRef.current.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[initPos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#aaccff" transparent opacity={0.65} sizeAttenuation />
    </points>
  )
}

// ─── Spaceship ─────────────────────────────────────────────────────────────────

const SHIP_ACCEL = 22   // units/sec²
const SHIP_DAMP  = 8    // exponential decay rate (frame-rate independent)
const SHIP_MAXV  = 12   // max lateral speed units/sec

function Ship({ gs }: { gs: React.MutableRefObject<GS> }) {
  const root   = useRef<THREE.Group>(null)
  const eng1   = useRef<THREE.PointLight>(null)
  const eng2   = useRef<THREE.PointLight>(null)
  const shield = useRef<THREE.PointLight>(null)

  useFrame((_, dt) => {
    if (!root.current) return

    // ── Physics (owned here, not in a separate rAF loop)
    if (!gs.current.dead && gs.current.started) {
      const { keys } = gs.current
      let ax = 0, ay = 0
      if (keys.has('ArrowLeft')  || keys.has('a')) ax -= 1
      if (keys.has('ArrowRight') || keys.has('d')) ax += 1
      if (keys.has('ArrowUp')    || keys.has('w')) ay += 1
      if (keys.has('ArrowDown')  || keys.has('s')) ay -= 1

      // Frame-rate independent: velocity decays as e^(-DAMP*dt) each frame
      const decay = Math.exp(-SHIP_DAMP * dt)
      gs.current.velX = Math.max(-SHIP_MAXV, Math.min(SHIP_MAXV, (gs.current.velX + ax * SHIP_ACCEL * dt) * decay))
      gs.current.velY = Math.max(-SHIP_MAXV, Math.min(SHIP_MAXV, (gs.current.velY + ay * SHIP_ACCEL * dt) * decay))

      // Position integrates directly — hitbox and visual are always the same point
      gs.current.shipX = Math.max(-5.8, Math.min(5.8, gs.current.shipX + gs.current.velX * dt))
      gs.current.shipY = Math.max(-3.8, Math.min(3.8, gs.current.shipY + gs.current.velY * dt))
    }

    // ── Mesh follows position exactly (no lerp = no hitbox/visual mismatch)
    root.current.position.x = gs.current.shipX
    root.current.position.y = gs.current.shipY

    // Bank / pitch (pure visual rotation — doesn't affect hitbox)
    root.current.rotation.z += (-gs.current.velX * 0.1 - root.current.rotation.z) * 8 * dt
    root.current.rotation.x += ( gs.current.velY * 0.06 - root.current.rotation.x) * 8 * dt
    // Engine flicker
    if (eng1.current)   eng1.current.intensity   = 3.5 + Math.random() * 2
    if (eng2.current)   eng2.current.intensity   = 3.5 + Math.random() * 2
    if (shield.current) shield.current.intensity = 1.2 + Math.random() * 0.8
  })

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* Fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.32, 1.5, 6]} />
        <meshStandardMaterial color="#071828" emissive="#00ccff" emissiveIntensity={0.3} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.7, 6]} />
        <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={0.9} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Left wing */}
      <mesh position={[-0.75, 0, 0.15]} rotation={[0.1, 0, 0.18]}>
        <boxGeometry args={[0.85, 0.04, 0.55]} />
        <meshStandardMaterial color="#061420" emissive="#00ccff" emissiveIntensity={0.25} metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Right wing */}
      <mesh position={[0.75, 0, 0.15]} rotation={[-0.1, 0, -0.18]}>
        <boxGeometry args={[0.85, 0.04, 0.55]} />
        <meshStandardMaterial color="#061420" emissive="#00ccff" emissiveIntensity={0.25} metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Left engine cone */}
      <mesh position={[-0.38, 0, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 0.4, 8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.0} transparent opacity={0.85} />
      </mesh>
      {/* Right engine cone */}
      <mesh position={[0.38, 0, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 0.4, 8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.0} transparent opacity={0.85} />
      </mesh>
      {/* Engine glow discs */}
      <mesh position={[-0.38, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 16]} />
        <meshBasicMaterial color="#00ddff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.38, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 16]} />
        <meshBasicMaterial color="#00ddff" transparent opacity={0.9} />
      </mesh>
      {/* Lights */}
      <pointLight ref={eng1}   position={[-0.38, 0, -1.1]} intensity={4}   color="#00ccff" distance={6} />
      <pointLight ref={eng2}   position={[ 0.38, 0, -1.1]} intensity={4}   color="#00ccff" distance={6} />
      <pointLight ref={shield} position={[0, 0, 0.8]}      intensity={1.5} color="#00ffaa" distance={5} />
    </group>
  )
}

// ─── Camera Rig ────────────────────────────────────────────────────────────────
// Trails slightly behind and above ship; FOV breathes with speed

function CameraRig({ gs }: { gs: React.MutableRefObject<GS> }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 1.5, 8)
    camera.lookAt(0, 0, -30)
  }, [camera])

  useFrame((_, dt) => {
    const { shipX, shipY, speed } = gs.current
    // Camera lags behind ship for weight
    camera.position.x += (shipX * 0.25 - camera.position.x) * 3 * dt
    camera.position.y += (shipY * 0.25 + 1.5 - camera.position.y) * 3 * dt
    // Look ahead of ship slightly
    camera.lookAt(shipX * 0.08, shipY * 0.08, -30)
    // FOV rush at high speed
    const fov = (camera as THREE.PerspectiveCamera)
    const targetFov = 62 + speed * 1.8
    fov.fov += (targetFov - fov.fov) * 2 * dt
    fov.updateProjectionMatrix()
  })

  return null
}

// ─── Asteroid Field ────────────────────────────────────────────────────────────
// Uses imperative mesh updates — zero React state changes per frame

// Each entry: [baseColor, emissiveColor, glowColor|undefined, metalness, roughness]
const ROCK_DEFS: [string, string, string | undefined, number, number][] = [
  ['#3a3530', '#0a0806', undefined,  0.15, 0.95],  // dark charcoal
  ['#4a5560', '#080e14', undefined,  0.35, 0.75],  // metallic grey-blue
  ['#5a1808', '#cc2200', '#ff3300',  0.05, 0.98],  // lava rock — danger
  ['#2a3a2a', '#040a04', undefined,  0.20, 0.90],  // dark moss
  ['#5a3d18', '#c85000', '#ff6600',  0.05, 0.96],  // ember rock — danger
  ['#484035', '#0c0a08', undefined,  0.40, 0.80],  // iron ore
  ['#203040', '#002244', '#0055ff',  0.55, 0.60],  // crystal blue — rare glow
]

function AsteroidField({
  gs,
  mode,
  onDead,
}: {
  gs: React.MutableRefObject<GS>
  mode: GameMode
  onDead: () => void
}) {
  const [rocks, setRocks]     = useState<Rock[]>([])
  const rocksRef              = useRef<Rock[]>([])
  const meshRefs              = useRef<Map<number, THREE.Object3D>>(new Map())
  const nextId                = useRef(0)
  const lastSpawn             = useRef(Date.now())
  const deadFired             = useRef(false)

  useFrame((_, dt) => {
    if (!gs.current.started || gs.current.dead) return

    const speed    = gs.current.speed
    const m        = MODES[mode]
    const flowSpd  = (12 + speed * 3.5) * m.speedMult * dt
    const now      = Date.now()

    // ── Update positions imperatively (no React re-render)
    const toRemove: number[] = []

    for (const r of rocksRef.current) {
      r.z    += flowSpd
      r.x    += r.driftX * dt
      r.y    += r.driftY * dt
      r.rotX += r.rx * dt
      r.rotY += r.ry * dt

      const mesh = meshRefs.current.get(r.id)
      if (mesh) {
        mesh.position.set(r.x, r.y, r.z)
        mesh.rotation.set(r.rotX, r.rotY, 0)
      }

      // Passed camera — remove
      if (r.z > 12) toRemove.push(r.id)

      // Sphere collision — fair round hitbox, only in ship's Z slice
      if (r.z > -2 && r.z < 2.5) {
        const dx   = r.x - gs.current.shipX
        const dy   = r.y - gs.current.shipY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < r.size * 0.75 + 0.3 && !deadFired.current) {
          gs.current.dead = true
          deadFired.current = true
          onDead()
        }
      }
    }

    if (toRemove.length > 0) {
      rocksRef.current = rocksRef.current.filter(r => !toRemove.includes(r.id))
      setRocks([...rocksRef.current])
    }

    // ── Score & difficulty
    gs.current.score += dt * 15 * (1 + speed * 0.12)
    if (gs.current.score > speed * 110) {
      gs.current.speed = Math.min(speed + 0.45 * m.speedMult, m.maxSpeed)
    }

    // ── Spawn
    const baseInterval = Math.max(220, 950 - speed * 38)
    const interval     = baseInterval / m.spawnMult
    if (now - lastSpawn.current > interval) {
      lastSpawn.current = now
      const type = Math.floor(Math.random() * ROCK_DEFS.length)
      const baseSize = 0.35 + Math.random() * 0.80
      const r: Rock = {
        id:     nextId.current++,
        x:      (Math.random() - 0.5) * 13,
        y:      (Math.random() - 0.5) * 9,
        z:      -85 - Math.random() * 30,
        rotX:   0, rotY: 0,
        size:   baseSize * m.sizeMult,
        type,
        rx:     (Math.random() - 0.5) * 2.5,
        ry:     (Math.random() - 0.5) * 2.5,
        driftX: (Math.random() - 0.5) * 0.4,
        driftY: (Math.random() - 0.5) * 0.3,
      }
      rocksRef.current.push(r)
      setRocks([...rocksRef.current])
    }
  })

  return (
    <>
      {rocks.map(r => {
        const [color, emissive, glowColor, metal, rough] = ROCK_DEFS[r.type]
        const geo = r.id % 4  // 0=dodeca, 1=icosa, 2=octa, 3=dodeca hi

        return (
          <group key={r.id} ref={el => {
            if (el) meshRefs.current.set(r.id, el)
            else meshRefs.current.delete(r.id)
          }}>
            {/* Main body */}
            <mesh castShadow>
              {geo === 0 && <dodecahedronGeometry args={[r.size, 1]} />}
              {geo === 1 && <icosahedronGeometry  args={[r.size, 1]} />}
              {geo === 2 && <octahedronGeometry   args={[r.size, 2]} />}
              {geo === 3 && <dodecahedronGeometry args={[r.size, 0]} />}
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={glowColor ? 2.0 : 0.3}
                flatShading
                roughness={rough}
                metalness={metal}
              />
            </mesh>

            {/* Inner core glow for lava/ember/crystal types */}
            {glowColor && (
              <mesh scale={0.55}>
                {geo === 0 && <dodecahedronGeometry args={[r.size, 0]} />}
                {geo !== 0 && <icosahedronGeometry  args={[r.size, 0]} />}
                <meshBasicMaterial color={glowColor} transparent opacity={0.35} side={THREE.BackSide} />
              </mesh>
            )}

            {/* Point light for glowing types */}
            {glowColor && (
              <pointLight
                color={glowColor}
                intensity={1.5 + r.size * 0.8}
                distance={r.size * 6}
              />
            )}
          </group>
        )
      })}
    </>
  )
}

// ─── Explosion ─────────────────────────────────────────────────────────────────

function Explosion({ pos }: { pos: THREE.Vector3 }) {
  const COUNT = 60
  const refs  = useRef<(THREE.Mesh | null)[]>([])
  const vels  = useRef(
    Array.from({ length: COUNT }, () =>
      new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8)
    )
  )
  const life = useRef(1.0)

  useFrame((_, dt) => {
    life.current -= dt * 1.1
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.addScaledVector(vels.current[i], dt)
      vels.current[i].multiplyScalar(0.91)
      const l = Math.max(0, life.current)
      mesh.scale.setScalar(l)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = l
    })
  })

  const particles = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      key: i,
      size: 0.05 + Math.random() * 0.15,
      color: ['\n#ff6600', '#ffaa00', '#ff3300', '#ffffff', '#ffdd00'][Math.floor(Math.random() * 5)].trim(),
    })), [])

  return (
    <>
      {particles.map((p, i) => (
        <mesh key={p.key} ref={el => { refs.current[i] = el }} position={pos.clone()}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={1} />
        </mesh>
      ))}
    </>
  )
}

// ─── World ─────────────────────────────────────────────────────────────────────

// ─── Camera Shake ─────────────────────────────────────────────────────────────

function CameraShake({ gs }: { gs: React.MutableRefObject<GS> }) {
  const { camera } = useThree()
  const shakeRef   = useRef(0)

  useFrame((_, dt) => {
    // Near-miss shake: asteroid passes within threshold near the ship Z plane
    if (gs.current.dead) {
      shakeRef.current = Math.max(shakeRef.current, 0.25)
    }
    if (shakeRef.current > 0) {
      const s = shakeRef.current
      camera.position.x += (Math.random() - 0.5) * s * 0.25
      camera.position.y += (Math.random() - 0.5) * s * 0.15
      shakeRef.current = Math.max(0, shakeRef.current - dt * 3)
    }
  })

  return null
}

// ─── World ─────────────────────────────────────────────────────────────────────

function World({ gs, mode, onDead }: { gs: React.MutableRefObject<GS>; mode: GameMode; onDead: () => void }) {
  const [explPos, setExplPos] = useState<THREE.Vector3 | null>(null)
  const explFired = useRef(false)

  const handleDead = () => {
    if (explFired.current) return
    explFired.current = true
    setExplPos(new THREE.Vector3(gs.current.shipX, gs.current.shipY, 0))
    setTimeout(onDead, 1400)
  }

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[0,  8, -25]} intensity={3.0} color="#2255ff" />
      <pointLight position={[0, -8, -50]} intensity={1.0} color="#110033" />
      <pointLight position={[0,  0, -15]} intensity={0.4} color="#0033aa" />

      <CameraRig gs={gs} />
      <CameraShake gs={gs} />

      <TunnelStars gs={gs} />

      {!gs.current.dead && <Ship gs={gs} />}
      {!gs.current.dead && <EngineTrail gs={gs} />}
      {explPos && <Explosion pos={explPos} />}

      <AsteroidField gs={gs} mode={mode} onDead={handleDead} />

      <EffectComposer>
        <Bloom
          intensity={2.4}
          luminanceThreshold={0.04}
          luminanceSmoothing={0.85}
          kernelSize={KernelSize.LARGE}
          mipmapBlur
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0008, 0.0008)}
          radialModulation
          modulationOffset={0.45}
        />
        <Vignette eskil={false} offset={0.12} darkness={0.88} />
      </EffectComposer>
    </>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export function SpaceGame() {
  const navigate = useNavigate()
  const gs       = useRef<GS>(makeGS())

  const [phase,        setPhase]        = useState<'menu' | 'playing' | 'dead'>('menu')
  const [displayScore, setDisplayScore] = useState(0)
  const [displaySpeed, setDisplaySpeed] = useState(1)
  const [hiScore,      setHiScore]      = useState(() => parseInt(localStorage.getItem('solar-hiscore') ?? '0'))
  const [mode,         setMode]         = useState<GameMode>('normal')
  const [showModes,    setShowModes]    = useState(false)
  const cmdBuffer      = useRef<string[]>([])

  // HUD sync (100ms — decoupled from render loop)
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setDisplayScore(Math.floor(gs.current.score))
      setDisplaySpeed(parseFloat(gs.current.speed.toFixed(1)))
    }, 100)
    return () => clearInterval(id)
  }, [phase])

  // Keys
  useEffect(() => {
    const MODES_SEQ = ['/', 'm', 'o', 'd', 'e', 's']
    const dn = (e: KeyboardEvent) => {
      gs.current.keys.add(e.key)
      if (e.key === 'Escape') {
        if (showModes) { setShowModes(false); return }
        navigate('/system')
      }
      // /modes command detection
      cmdBuffer.current = [...cmdBuffer.current, e.key].slice(-6)
      if (MODES_SEQ.every((k, i) => k === cmdBuffer.current[i] && cmdBuffer.current.length === 6)) {
        setShowModes(s => !s)
        cmdBuffer.current = []
      }
    }
    const up = (e: KeyboardEvent) => gs.current.keys.delete(e.key)
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [navigate, showModes])

  const startGame = () => {
    gs.current = makeGS()
    gs.current.started = true
    setDisplayScore(0)
    setDisplaySpeed(1)
    setPhase('playing')
  }

  const handleDead = () => {
    const s = Math.floor(gs.current.score)
    setDisplayScore(s)
    if (s > hiScore) { setHiScore(s); localStorage.setItem('solar-hiscore', String(s)) }
    setPhase('dead')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000005', position: 'relative', overflow: 'hidden' }}>

      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,255,0.01) 3px, rgba(0,200,255,0.01) 4px)',
      }} />

      <Canvas camera={{ position: [0, 1.5, 8], fov: 62 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#02001a', 20, 100]} />
        {phase === 'playing' && <World gs={gs} mode={mode} onDead={handleDead} />}
      </Canvas>

      {/* ── Playing HUD ── */}
      {phase === 'playing' && (
        <>
          <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, fontFamily: '"Share Tech Mono", monospace' }}>
            <div style={{ fontSize: '1.6rem', color: '#00ffaa', letterSpacing: '0.08em', textShadow: '0 0 16px rgba(0,255,170,0.7)' }}>
              {String(displayScore).padStart(6, '0')}
            </div>
            <div style={{ fontSize: '0.48rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.35em', marginTop: '0.2rem' }}>SCORE</div>
          </div>

          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, fontFamily: '"Share Tech Mono", monospace', textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(0,200,255,0.55)', letterSpacing: '0.1em' }}>×{displaySpeed}</div>
            <div style={{ fontSize: '0.48rem', color: 'rgba(0,200,255,0.3)', letterSpacing: '0.3em', marginTop: '0.15rem' }}>SPEED</div>
          </div>

          {hiScore > 0 && (
            <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontFamily: '"Share Tech Mono", monospace', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,170,0,0.4)', letterSpacing: '0.2em' }}>
                BEST {String(hiScore).padStart(6, '0')}
              </div>
            </div>
          )}

          {/* Mode badge */}
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 10, fontFamily: '"Share Tech Mono", monospace' }}>
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: MODES[mode].color, textShadow: `0 0 8px ${MODES[mode].color}` }}>
              ◈ {MODES[mode].label}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontFamily: '"Share Tech Mono", monospace', fontSize: '0.48rem', color: 'rgba(0,200,255,0.2)', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
            WASD / ARROWS — MOVE &nbsp;·&nbsp; TYPE /modes — SWITCH MODE &nbsp;·&nbsp; ESC — EXIT
          </div>
        </>
      )}

      {/* ── Overlays ── */}
      <AnimatePresence>
        {phase === 'menu' && (
          <motion.div key="menu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}
            style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Share Tech Mono", monospace', background: 'rgba(0,0,5,0.88)' }}
          >
            <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.7, ease: 'easeOut' }} style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.5em', color: 'rgba(0,200,255,0.4)', marginBottom: '0.8rem' }}>◈ CLASSIFIED MISSION ◈</div>
              <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.2em', color: '#00ffaa', textShadow: '0 0 40px rgba(0,255,170,0.7), 0 0 80px rgba(0,255,170,0.3)' }}>
                SPACE RUNNER
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(0,200,255,0.35)', letterSpacing: '0.3em', marginTop: '0.6rem' }}>
                NAVIGATE THE ASTEROID FIELD
              </div>
            </motion.div>

            {hiScore > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                style={{ fontSize: '0.7rem', color: 'rgba(255,170,0,0.5)', letterSpacing: '0.2em', marginBottom: '2rem' }}
              >
                BEST: {String(hiScore).padStart(6, '0')}
              </motion.div>
            )}

            <motion.button
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
              onClick={startGame}
              style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', letterSpacing: '0.3em', padding: '1rem 3.5rem', background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.5)', color: '#00ffaa', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,255,170,0.15)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,170,0.18)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(0,255,170,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,255,170,0.08)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,170,0.15)' }}
            >
              LAUNCH MISSION
            </motion.button>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ marginTop: '2.5rem', fontSize: '0.55rem', color: 'rgba(0,200,255,0.25)', letterSpacing: '0.2em', lineHeight: 2.2, textAlign: 'center' }}
            >
              <div>WASD / ARROWS — MOVE IN ALL DIRECTIONS</div>
              <div>TYPE /modes — SELECT DIFFICULTY</div>
              <div>ESC — EXIT TO SOLAR SYSTEM</div>
            </motion.div>

            {/* Current mode badge on menu */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: '1.2rem', fontSize: '0.6rem', letterSpacing: '0.25em', color: MODES[mode].color, textShadow: `0 0 10px ${MODES[mode].color}` }}
            >
              MODE: {MODES[mode].label}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              onClick={() => navigate('/system')}
              style={{ marginTop: '1.5rem', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(0,200,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,200,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,200,255,0.3)'}
            >
              ← BACK TO SOLAR SYSTEM
            </motion.button>
          </motion.div>
        )}

        {phase === 'dead' && (
          <motion.div key="dead"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}
            style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Share Tech Mono", monospace', background: 'rgba(0,0,5,0.92)' }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.7 }}
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '0.2em', color: '#ff4444', textShadow: '0 0 30px rgba(255,68,68,0.8), 0 0 60px rgba(255,68,68,0.3)', marginBottom: '2rem' }}
            >
              MISSION FAILED
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.0 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '2.2rem', color: '#00ffaa', letterSpacing: '0.1em', textShadow: '0 0 20px rgba(0,255,170,0.6)' }}>
                {String(displayScore).padStart(6, '0')}
              </div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.3em', marginTop: '0.3rem' }}>FINAL SCORE</div>
              {displayScore >= hiScore && displayScore > 0 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: 'spring' }}
                  style={{ fontSize: '0.65rem', color: '#ffaa00', letterSpacing: '0.3em', marginTop: '0.6rem', textShadow: '0 0 10px rgba(255,170,0,0.6)' }}
                >★ NEW RECORD ★</motion.div>
              )}
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }} style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={startGame}
                style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', letterSpacing: '0.2em', padding: '0.9rem 2.5rem', background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.5)', color: '#00ffaa', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,170,0.2)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,170,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,255,170,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
              >RETRY</button>
              <button onClick={() => navigate('/system')}
                style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', letterSpacing: '0.15em', padding: '0.9rem 2rem', background: 'transparent', border: '1px solid rgba(0,200,255,0.25)', color: 'rgba(0,200,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.6)'; e.currentTarget.style.color = '#00ccff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.25)'; e.currentTarget.style.color = 'rgba(0,200,255,0.5)' }}
              >← SOLAR SYSTEM</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mode Selector ── */}
      <AnimatePresence>
        {showModes && (
          <motion.div
            key="modes"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,8,0.88)', fontFamily: '"Share Tech Mono", monospace',
            }}
          >
            <div style={{ width: '100%', maxWidth: 480, padding: '0 2rem' }}>
              <div style={{ fontSize: '0.55rem', letterSpacing: '0.5em', color: 'rgba(0,200,255,0.4)', marginBottom: '0.6rem', textAlign: 'center' }}>
                ◈ SELECT DIFFICULTY ◈
              </div>
              <div style={{ fontSize: '1.2rem', letterSpacing: '0.2em', color: '#00ccff', textAlign: 'center', marginBottom: '2.5rem', textShadow: '0 0 20px rgba(0,200,255,0.5)' }}>
                MISSION MODE
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(Object.entries(MODES) as [GameMode, typeof MODES[GameMode]][]).map(([key, m]) => (
                  <motion.button
                    key={key}
                    whileHover={{ x: 6 }}
                    onClick={() => { setMode(key); setShowModes(false) }}
                    style={{
                      fontFamily: '"Share Tech Mono", monospace',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.5rem',
                      background: mode === key ? `rgba(${key === 'easy' ? '0,255,170' : key === 'normal' ? '0,200,255' : key === 'hard' ? '255,170,0' : '255,68,68'},0.12)` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${mode === key ? m.color : 'rgba(255,255,255,0.08)'}`,
                      color: mode === key ? m.color : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: mode === key ? `0 0 20px ${m.color}22` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1rem', letterSpacing: '0.15em', color: mode === key ? m.color : 'rgba(255,255,255,0.5)' }}>
                        {mode === key ? '▶ ' : '  '}{m.label}
                      </span>
                      <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
                        {m.desc}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: i < (key === 'easy' ? 1 : key === 'normal' ? 2 : key === 'hard' ? 3 : 4)
                            ? m.color : 'rgba(255,255,255,0.1)',
                          boxShadow: i < (key === 'easy' ? 1 : key === 'normal' ? 2 : key === 'hard' ? 3 : 4)
                            ? `0 0 4px ${m.color}` : 'none',
                        }} />
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.5rem', color: 'rgba(0,200,255,0.25)', letterSpacing: '0.2em' }}>
                ESC OR /modes TO CLOSE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
