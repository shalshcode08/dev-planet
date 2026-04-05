import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SolarSystem } from '@/components/scene/SolarSystem'
import { EffectPipeline } from '@/postprocessing/EffectPipeline'
import { HUDOverlay } from '@/components/hud/HUDOverlay'
import { useSpaceStore } from '@/store/useSpaceStore'
import { UsernameEntry } from '@/screens/UsernameEntry'
import { RepoSelect } from '@/screens/RepoSelect'
import { GeneratingScreen } from '@/screens/GeneratingScreen'
import { SpaceGame } from '@/screens/SpaceGame'
import { SharedSystemRoute } from '@/screens/SharedSystemRoute'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onComplete, 1000)
    }, 5000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1 } }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 200,
            background: '#000005',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{
              fontFamily: '"Share Tech Mono", monospace',
              textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 5, times: [0, 0.1, 0.8, 1] }}
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.4em',
                color: 'rgba(0, 200, 255, 0.5)',
                marginBottom: '0.8rem',
              }}
            >
              ◈ SYSTEM INITIALIZED
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 5, times: [0, 0.15, 0.75, 1] }}
              style={{
                fontSize: '1.6rem',
                letterSpacing: '0.15em',
                color: '#00ffaa',
                textShadow: '0 0 30px rgba(0, 255, 170, 0.5)',
              }}
            >
              SOLAR SYSTEM ONLINE
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0, 0.5, 0, 0.5, 0] }}
              transition={{ duration: 5 }}
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: 'rgba(0, 200, 255, 0.4)',
                marginTop: '1rem',
              }}
            >
              ENTERING ORBITAL VIEW...
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SystemRoute() {
  const enrichedRepos = useSpaceStore((s) => s.enrichedRepos)
  const introComplete = useSpaceStore((s) => s.introComplete)
  const setIntroComplete = useSpaceStore((s) => s.setIntroComplete)
  const [showIntro, setShowIntro] = useState(!introComplete)

  const handleIntroComplete = () => {
    setShowIntro(false)
    setIntroComplete(true)
  }

  if (enrichedRepos.length === 0) {
    return <Navigate to="/" replace />
  }

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

      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: 'none', 
        zIndex: 10,
        opacity: showIntro ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}>
        <HUDOverlay />
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <div style={{ width: '100vw', height: '100vh', background: '#000005', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<UsernameEntry />} />
          <Route path="/select" element={<RepoSelect />} />
          <Route path="/generating" element={<GeneratingScreen />} />
          <Route path="/system" element={<SystemRoute />} />
          <Route path="/system-game-101" element={<SpaceGame />} />
          <Route path="/u/:username" element={<SharedSystemRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}