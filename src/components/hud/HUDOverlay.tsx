import { useSpaceStore } from '@/store/useSpaceStore'
import { AnimatePresence, motion } from 'framer-motion'
import { RepoDetailsPanel } from './RepoDetailsPanel'
import { ScanlineOverlay } from './ScanlineOverlay'

export function HUDOverlay() {
  const coords = useSpaceStore((s) => s.fakeCoords)
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const hoveredId = useSpaceStore((s) => s.hoveredPlanetId)
  const githubUsername = useSpaceStore((s) => s.githubUsername)

  return (
    <>
      <ScanlineOverlay />

      {/* Bottom-left HUD coordinates */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '0.7rem',
          color: 'rgba(0, 200, 255, 0.6)',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          zIndex: 100,
          lineHeight: 1.8,
          userSelect: 'none',
        }}
      >
        <div>SECTOR {coords.sector}</div>
        <div>
          X: {String(coords.x).padStart(7, ' ')}  Y: {String(coords.y).padStart(7, ' ')}  Z: {String(coords.z).padStart(7, ' ')}
        </div>
        <div style={{ marginTop: '0.3rem', color: 'rgba(0, 255, 170, 0.4)', fontSize: '0.6rem', minHeight: '1.2em' }}>
          <AnimatePresence mode="wait">
            {selectedId ? (
              <motion.span
                key="selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                VIEWING: {selectedId.split('/')[1]}
              </motion.span>
            ) : hoveredId ? (
              <motion.span
                key="hover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                style={{ color: 'rgba(255, 170, 0, 0.5)' }}
              >
                → {hoveredId.split('/')[1]}
              </motion.span>
            ) : (
              <span>◈ SCANNING...</span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Top-left mission tag */}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          left: '1.5rem',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '0.65rem',
          color: 'rgba(0, 200, 255, 0.35)',
          letterSpacing: '0.15em',
          pointerEvents: 'none',
          zIndex: 100,
          userSelect: 'none',
        }}
      >
        <div>SOLAR.SYS / PORTFOLIO.EXE</div>
        <div style={{ color: 'rgba(0, 255, 170, 0.25)', fontSize: '0.58rem', marginTop: '0.2rem' }}>
          v2.0.0 — {githubUsername.toUpperCase()}
        </div>
      </div>

      {/* Top-right — controls hint */}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '0.6rem',
          color: 'rgba(0, 200, 255, 0.25)',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          zIndex: 100,
          textAlign: 'right',
          lineHeight: 1.9,
          userSelect: 'none',
        }}
      >
        <div>DRAG — rotate</div>
        <div>SCROLL — zoom</div>
        <div>CLICK — view details</div>
        <div>ESC — release</div>
      </div>

      {/* Detail panel when planet selected */}
      <AnimatePresence mode="wait">
        {selectedId && <RepoDetailsPanel key={selectedId} />}
      </AnimatePresence>
    </>
  )
}
