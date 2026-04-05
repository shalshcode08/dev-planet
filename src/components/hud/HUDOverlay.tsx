import { useCallback, useState } from 'react'
import { useSpaceStore } from '@/store/useSpaceStore'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { RepoDetailsPanel } from './RepoDetailsPanel'
import { ScanlineOverlay } from './ScanlineOverlay'
import { EasterEggs } from './EasterEggs'

interface HUDOverlayProps {
  /** Present when rendering someone else's shared system */
  sharedUsername?: string
}

export function HUDOverlay({ sharedUsername }: HUDOverlayProps = {}) {
  const coords         = useSpaceStore((s) => s.fakeCoords)
  const selectedId     = useSpaceStore((s) => s.selectedPlanetId)
  const hoveredId      = useSpaceStore((s) => s.hoveredPlanetId)
  const githubUsername = useSpaceStore((s) => s.githubUsername)
  const enrichedRepos  = useSpaceStore((s) => s.enrichedRepos)
  const navigate       = useNavigate()

  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const isSharedView = !!sharedUsername

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleShare = useCallback(() => {
    const shortNames = enrichedRepos.map((r) => r.name).join(',')
    const url = `https://devplanet.online/u/${githubUsername}?r=${encodeURIComponent(shortNames)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2200)
    })
  }, [githubUsername, enrichedRepos])

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
          zIndex: 100,
          userSelect: 'none',
          pointerEvents: isSharedView ? 'auto' : 'none',
        }}
      >
        {isSharedView ? (
          <>
            <div style={{ color: 'rgba(0, 255, 170, 0.5)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>
              ◈ VIEWING SOLAR SYSTEM
            </div>
            <div style={{ fontSize: '0.85rem', color: '#00ffaa', marginTop: '0.2rem', letterSpacing: '0.12em' }}>
              @{sharedUsername.toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <div>SOLAR.SYS / PORTFOLIO.EXE</div>
            <div style={{ color: 'rgba(0, 255, 170, 0.25)', fontSize: '0.58rem', marginTop: '0.2rem' }}>
              v2.0.0 — {githubUsername.toUpperCase()}
            </div>
          </>
        )}
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
        <div>← → — navigate</div>
        <div>ESC — release</div>
      </div>

      {/* Bottom-right — action buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 100,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.5rem',
        }}
      >
        {isSharedView ? (
          /* Shared view — CTA to build their own */
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.6rem',
              padding: '0.55rem 1rem',
              background: 'rgba(0, 255, 170, 0.12)',
              border: '1px solid rgba(0, 255, 170, 0.45)',
              color: '#00ffaa',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 170, 0.22)'
              e.currentTarget.style.borderColor = 'rgba(0, 255, 170, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 170, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(0, 255, 170, 0.45)'
            }}
          >
            ✦ CREATE YOUR OWN UNIVERSE ↗
          </button>
        ) : (
          /* Own view — share button */
          <AnimatePresence mode="wait">
            {copyState === 'copied' ? (
              <motion.div
                key="copied"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid rgba(0, 255, 170, 0.5)',
                  color: '#00ffaa',
                  letterSpacing: '0.1em',
                  background: 'rgba(0, 255, 170, 0.08)',
                }}
              >
                ✓ LINK COPIED!
              </motion.div>
            ) : (
              <motion.button
                key="share"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={handleShare}
                style={{
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0, 200, 255, 0.08)',
                  border: '1px solid rgba(0, 200, 255, 0.25)',
                  color: 'rgba(0, 200, 255, 0.6)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 200, 255, 0.15)'
                  e.currentTarget.style.color = '#00ccff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 200, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(0, 200, 255, 0.6)'
                }}
              >
                ⬡ SHARE
              </motion.button>
            )}
          </AnimatePresence>
        )}

        <button
          onClick={toggleFullscreen}
          style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '0.6rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(0, 255, 170, 0.08)',
            border: '1px solid rgba(0, 255, 170, 0.25)',
            color: 'rgba(0, 255, 170, 0.6)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 170, 0.15)'
            e.currentTarget.style.color = '#00ffaa'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 170, 0.08)'
            e.currentTarget.style.color = 'rgba(0, 255, 170, 0.6)'
          }}
        >
          ⛶ FULLSCREEN
        </button>
      </div>

      {/* Detail panel when planet selected */}
      <AnimatePresence mode="wait">
        {selectedId && <RepoDetailsPanel key={selectedId} />}
      </AnimatePresence>

      <EasterEggs />
    </>
  )
}
