import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Sprite, SpriteMaterial, AdditiveBlending,
  CanvasTexture, Vector3, Group,
} from 'three'

// ─── Texture factories ────────────────────────────────────────────────────────

function makeRoundGlow(size = 128): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  g.addColorStop(0.00, 'rgba(255,255,255,1.0)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.30, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.60, 'rgba(255,255,255,0.15)')
  g.addColorStop(1.00, 'rgba(255,255,255,0.00)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(c)
}

function makeStreak(w = 256, h = 32): CanvasTexture {
  // Horizontal anamorphic streak — wide and thin
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  const gx = ctx.createLinearGradient(0, 0, w, 0)
  gx.addColorStop(0.00, 'rgba(160,200,255,0.00)')
  gx.addColorStop(0.30, 'rgba(160,200,255,0.20)')
  gx.addColorStop(0.50, 'rgba(200,220,255,0.90)')
  gx.addColorStop(0.70, 'rgba(160,200,255,0.20)')
  gx.addColorStop(1.00, 'rgba(160,200,255,0.00)')
  ctx.fillStyle = gx
  ctx.fillRect(0, 0, w, h)
  // vertical softness
  const gy = ctx.createLinearGradient(0, 0, 0, h)
  gy.addColorStop(0.0, 'rgba(0,0,0,0.6)')
  gy.addColorStop(0.5, 'rgba(0,0,0,0.0)')
  gy.addColorStop(1.0, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = gy
  ctx.fillRect(0, 0, w, h)
  return new CanvasTexture(c)
}

function makeRing(size = 64): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const cx = size / 2, r = size * 0.38, rw = size * 0.08
  const g = ctx.createRadialGradient(cx, cx, r - rw, cx, cx, r + rw)
  g.addColorStop(0.0, 'rgba(255,255,255,0.00)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.70)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.90)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.70)')
  g.addColorStop(1.0, 'rgba(255,255,255,0.00)')
  ctx.fillStyle = g
  ctx.arc(cx, cx, r + rw * 2, 0, Math.PI * 2)
  ctx.fill()
  return new CanvasTexture(c)
}

function makeHex(size = 64): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const cx = size / 2, r = size * 0.42
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + r * Math.cos(a), cx + r * Math.sin(a))
  }
  ctx.closePath()
  const g = ctx.createRadialGradient(cx, cx, r * 0.6, cx, cx, r)
  g.addColorStop(0.0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.50)')
  g.addColorStop(1.0, 'rgba(255,255,255,0.00)')
  ctx.fillStyle = g
  ctx.fill()
  return new CanvasTexture(c)
}

// ─── Flare config ─────────────────────────────────────────────────────────────
// t = position along sun→center→opposite axis
//   t=0  → at sun      t=1 → at screen center      t=2 → opposite of sun

type TexType = 'round' | 'streak' | 'ring' | 'hex'

interface FlareElement {
  t: number          // axis position
  size: number       // world-space scale at DEPTH units
  baseOpacity: number
  color: string
  tex: TexType
  aspectX?: number   // non-uniform scale X (for streak)
  aspectY?: number
}

const FLARE_ELEMENTS: FlareElement[] = [
  // ── Main sun corona — huge soft glow
  { t: 0.00, size: 7.0, baseOpacity: 0.85, color: '#fff6e0', tex: 'round' },
  // ── Anamorphic horizontal streak
  { t: 0.00, size: 2.0, baseOpacity: 0.55, color: '#aac8ff', tex: 'streak', aspectX: 8.0, aspectY: 0.08 },
  // ── Close ghost — warm
  { t: 0.28, size: 1.0, baseOpacity: 0.45, color: '#ffd580', tex: 'round' },
  // ── Second ghost — hexagonal bokeh
  { t: 0.50, size: 0.7, baseOpacity: 0.35, color: '#ffffff', tex: 'hex' },
  // ── Near-center ring
  { t: 0.72, size: 1.2, baseOpacity: 0.28, color: '#88ccff', tex: 'ring' },
  // ── Center — small cool round
  { t: 1.00, size: 0.6, baseOpacity: 0.30, color: '#c8e8ff', tex: 'round' },
  // ── Past center hex
  { t: 1.22, size: 0.9, baseOpacity: 0.20, color: '#ffaa55', tex: 'hex' },
  // ── Far ghost — large soft
  { t: 1.55, size: 2.2, baseOpacity: 0.14, color: '#cc88ff', tex: 'round' },
  // ── Opposite ring
  { t: 1.80, size: 0.8, baseOpacity: 0.12, color: '#55aaff', tex: 'ring' },
]

const DEPTH = 22  // units in front of camera (must be > near plane = 0.1)

const SUN_POS = new Vector3(0, 0, 0)

export function LensFlares() {
  const { camera } = useThree()
  const groupRef = useRef<Group>(null)

  const textures = useMemo(() => ({
    round:  makeRoundGlow(128),
    streak: makeStreak(256, 32),
    ring:   makeRing(64),
    hex:    makeHex(64),
  }), [])

  // Pre-create sprite materials so we can mutate opacity each frame
  const materials = useMemo<SpriteMaterial[]>(() =>
    FLARE_ELEMENTS.map((f) => new SpriteMaterial({
      map: textures[f.tex],
      color: f.color,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: f.baseOpacity,
      sizeAttenuation: true,
    })),
  [textures])

  // Camera-space helpers (reused every frame)
  const camRight   = useMemo(() => new Vector3(), [])
  const camUp      = useMemo(() => new Vector3(), [])
  const camFwd     = useMemo(() => new Vector3(), [])
  const sunNDC     = useMemo(() => new Vector3(), [])
  const toSun      = useMemo(() => new Vector3(), [])
  const worldPos   = useMemo(() => new Vector3(), [])

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // ── Visibility: how directly is camera facing the sun?
    camFwd.set(0, 0, -1).applyQuaternion(camera.quaternion)
    toSun.copy(SUN_POS).sub(camera.position).normalize()
    const dot = toSun.dot(camFwd)

    if (dot < 0.05) {
      group.visible = false
      return
    }
    group.visible = true

    // Smooth fade — dot^2 gives a gentle falloff
    const visibility = Math.pow(Math.max(0, dot), 2.5)

    // ── Project sun center to NDC [-1, 1]
    sunNDC.copy(SUN_POS).project(camera)

    // ── Camera basis vectors (for placing sprites in camera space)
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion)
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion)

    // FOV geometry at DEPTH units
    const fovRad = (camera as { fov: number }).fov * (Math.PI / 180)
    const halfH  = DEPTH * Math.tan(fovRad / 2)
    const halfW  = halfH * (window.innerWidth / window.innerHeight)

    const sprites = group.children as Sprite[]

    sprites.forEach((sprite, i) => {
      const el = FLARE_ELEMENTS[i]
      const t = el.t

      // Flare axis: NDC position = sunNDC * (1 - t)
      //  t=0 → at sun, t=1 → screen center, t=2 → opposite of sun
      const nx = sunNDC.x * (1 - t)
      const ny = sunNDC.y * (1 - t)

      // Convert NDC to world position (camera-space offset at DEPTH)
      worldPos
        .copy(camera.position)
        .addScaledVector(camFwd, DEPTH)
        .addScaledVector(camRight, nx * halfW)
        .addScaledVector(camUp, ny * halfH)

      sprite.position.copy(worldPos)

      // Scale — sprites are at DEPTH units, scale in world units
      const sx = el.size * (el.aspectX ?? 1)
      const sy = el.size * (el.aspectY ?? 1)
      sprite.scale.set(sx, sy, 1)

      // Fade with visibility and edge fade
      const edgeFade = 1 - Math.min(1, Math.sqrt(nx * nx + ny * ny) * 0.6)
      materials[i].opacity = el.baseOpacity * visibility * Math.max(0.1, edgeFade)
    })
  })

  return (
    <group ref={groupRef} renderOrder={100}>
      {FLARE_ELEMENTS.map((_, i) => (
        <sprite key={i} material={materials[i]} renderOrder={100} />
      ))}
    </group>
  )
}
