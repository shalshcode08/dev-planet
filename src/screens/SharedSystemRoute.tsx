import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useSpaceStore, type EnrichedRepo } from '@/store/useSpaceStore'
import { SolarSystem } from '@/components/scene/SolarSystem'
import { EffectPipeline } from '@/postprocessing/EffectPipeline'
import { HUDOverlay } from '@/components/hud/HUDOverlay'
import {
  fetchUserRepos,
  fetchRepoLanguages,
  fetchRepoOpenPRs,
  fetchRepoCommits,
} from '@/api/github'
import { getPlanetType, getOrbitConfig } from '@/data/planetTypes'

type Phase = 'loading' | 'ready' | 'error'

const LOAD_MSGS = [
  'SCANNING REGISTRY...',
  'FETCHING ORBITAL DATA...',
  'CALIBRATING PLANET SHADERS...',
  'CONSTRUCTING SOLAR SYSTEM...',
  'ALIGNING GRAVITATIONAL CONSTANTS...',
]

export function SharedSystemRoute() {
  const { username } = useParams<{ username: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const reposParam = searchParams.get('r')

  const setEnrichedRepos = useSpaceStore((s) => s.setEnrichedRepos)
  const setGithubUsername = useSpaceStore((s) => s.setGithubUsername)
  const setIntroComplete  = useSpaceStore((s) => s.setIntroComplete)

  const [phase,   setPhase]   = useState<Phase>('loading')
  const [msgIdx,  setMsgIdx]  = useState(0)
  const [errMsg,  setErrMsg]  = useState('')
  const ran = useRef(false)

  // Cycle through flavour text while loading
  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % LOAD_MSGS.length), 1400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!username || ran.current) return
    ran.current = true
    load()
  }, [username]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!username) return
    try {
      const allRepos = await fetchUserRepos(username)

      // Determine which repos to show
      let selected = allRepos
      if (reposParam) {
        const names = reposParam.split(',').map((n) => n.trim().toLowerCase())
        selected = allRepos.filter((r) => names.includes(r.name.toLowerCase()))
        if (selected.length === 0) {
          // Param had stale names — fall back to top 8 by stars
          selected = [...allRepos].sort((a, b) => b.stars - a.stars).slice(0, 8)
        }
      } else {
        selected = [...allRepos].sort((a, b) => b.stars - a.stars).slice(0, 8)
      }

      // Enrich repos (same pipeline as GeneratingScreen)
      const enriched: EnrichedRepo[] = await Promise.all(
        selected.slice(0, 8).map(async (repo, i) => {
          const [commits, languages, openPRs] = await Promise.all([
            fetchRepoCommits(repo.fullName),
            fetchRepoLanguages(repo.fullName),
            fetchRepoOpenPRs(repo.fullName),
          ])
          return {
            ...repo,
            commits,
            openPRs,
            closedPRs: 0,
            languages,
            planetType: getPlanetType(repo.language, i),
            ...getOrbitConfig(i),
          }
        })
      )

      // Write to store (same as normal flow — SolarSystem reads from here)
      setGithubUsername(username)
      setEnrichedRepos(enriched)
      setIntroComplete(true) // skip cinematic for shared views
      setPhase('ready')
    } catch {
      setErrMsg('USER NOT FOUND IN REGISTRY')
      setPhase('error')
    }
  }

  if (!username) return <Navigate to="/" replace />

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#000005',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: '"Share Tech Mono", monospace',
        color: '#ff4444', gap: '1.5rem',
      }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(255,70,70,0.5)' }}>
          ◈ TRANSMISSION FAILED
        </div>
        <div style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>{errMsg}</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,70,70,0.4)', letterSpacing: '0.1em' }}>
          @{username}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '0.5rem',
            padding: '0.6rem 1.4rem',
            background: 'rgba(0,200,255,0.08)',
            border: '1px solid rgba(0,200,255,0.3)',
            color: '#00ccff',
            fontFamily: 'inherit',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            cursor: 'pointer',
          }}
        >
          ← BUILD YOUR OWN
        </button>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#000005',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: '"Share Tech Mono", monospace',
        color: '#00ccff', gap: '1.2rem', overflow: 'hidden', position: 'relative',
      }}>
        {/* Faint grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(#00ccff 1px, transparent 1px), linear-gradient(90deg, #00ccff 1px, transparent 1px)',
          backgroundSize: '60px 60px', pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.4em', color: 'rgba(0,200,255,0.35)', marginBottom: '0.6rem' }}>
            ◈ INCOMING TRANSMISSION
          </div>
          <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', letterSpacing: '0.15em', color: '#00ffaa', marginBottom: '0.4rem' }}>
            @{username.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(0,200,255,0.35)' }}>
            SOLAR SYSTEM
          </div>
        </motion.div>

        {/* Spinner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 48, height: 48,
            border: '1px solid rgba(0,255,170,0.15)',
            borderTop: '1px solid #00ffaa',
            borderRadius: '50%',
          }}
        />

        <motion.div
          key={msgIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ fontSize: '0.58rem', letterSpacing: '0.15em', color: 'rgba(0,200,255,0.4)' }}
        >
          {LOAD_MSGS[msgIdx]}
        </motion.div>
      </div>
    )
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 15, 55], fov: 60, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000005']} />
          <fog attach="fog" args={['#000010', 200, 900]} />
          <ambientLight intensity={0.04} />
          <SolarSystem />
          <EffectPipeline />
        </Suspense>
      </Canvas>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <HUDOverlay sharedUsername={username} />
      </div>
    </>
  )
}
