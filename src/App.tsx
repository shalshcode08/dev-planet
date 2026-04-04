import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SolarSystem } from '@/components/scene/SolarSystem'
import { EffectPipeline } from '@/postprocessing/EffectPipeline'
import { HUDOverlay } from '@/components/hud/HUDOverlay'
import { useSpaceStore } from '@/store/useSpaceStore'
import { UsernameEntry } from '@/screens/UsernameEntry'
import { RepoSelect } from '@/screens/RepoSelect'
import { GeneratingScreen } from '@/screens/GeneratingScreen'
import './index.css'

function SystemRoute() {
  const enrichedRepos = useSpaceStore((s) => s.enrichedRepos)
  
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

      {/* DOM HUD layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
