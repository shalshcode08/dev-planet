import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SolarSystem } from '@/components/scene/SolarSystem'
import { EffectPipeline } from '@/postprocessing/EffectPipeline'
import { HUDOverlay } from '@/components/hud/HUDOverlay'
import { useSpaceStore } from '@/store/useSpaceStore'
import { UsernameEntry } from '@/screens/UsernameEntry'
import { RepoSelect } from '@/screens/RepoSelect'
import { GeneratingScreen } from '@/screens/GeneratingScreen'
import './index.css'

export default function App() {
  const appPhase = useSpaceStore((s) => s.appPhase)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000005', overflow: 'hidden' }}>
      {appPhase === 'solar-system' && (
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
      )}

      {/* Setup Screens */}
      {appPhase === 'username-entry' && <UsernameEntry />}
      {appPhase === 'repo-select' && <RepoSelect />}
      {appPhase === 'generating' && <GeneratingScreen />}
    </div>
  )
}
