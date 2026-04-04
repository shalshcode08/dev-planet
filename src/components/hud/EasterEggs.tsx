import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/useSpaceStore'

// ─── Key sequence patterns ────────────────────────────────────────────────────

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
const WARP   = ['w','a','r','p']
const NOVA   = ['n','o','v','a']
const HACK   = ['h','a','c','k']

const MAX_BUFFER = 12

// ─── Hack terminal lines ──────────────────────────────────────────────────────

const HACK_LINES = [
  '> INITIATING INTRUSION SEQUENCE...',
  '> BYPASSING FIREWALL [████████] OK',
  '> ESCALATING PRIVILEGES...',
  '> ROOT ACCESS GRANTED ✓',
  '> SCANNING ORBITAL DATABASE...',
  `> FOUND: ${Math.floor(Math.random() * 4) + 5} CLASSIFIED OBJECTS`,
  '> DECRYPTING PLANET SIGNATURES...',
  '> LOADING CLASSIFIED DATA [████████] 100%',
  '> WELCOME, COMMANDER.',
]

type EggType = 'turbo' | 'warp' | 'nova' | 'hack' | null

// ─── Component ────────────────────────────────────────────────────────────────

export function EasterEggs() {
  const setTurboMode = useSpaceStore((s) => s.setTurboMode)

  const [activeEgg, setActiveEgg] = useState<EggType>(null)
  const [hackLines, setHackLines] = useState<string[]>([])

  const bufferRef = useRef<string[]>([])
  const turboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eggTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Match helper
  function matchesEnd(pattern: string[]) {
    const buf = bufferRef.current
    if (buf.length < pattern.length) return false
    const tail = buf.slice(-pattern.length)
    return pattern.every((k, i) => k === tail[i])
  }

  // ── Activate an egg
  function activate(egg: EggType, duration: number) {
    if (eggTimerRef.current) clearTimeout(eggTimerRef.current)
    setActiveEgg(egg)
    eggTimerRef.current = setTimeout(() => setActiveEgg(null), duration)
  }

  // ── Turbo Mode: planets go 5× speed for 12s
  function triggerTurbo() {
    if (turboTimerRef.current) clearTimeout(turboTimerRef.current)
    setTurboMode(true)
    activate('turbo', 12_000)
    turboTimerRef.current = setTimeout(() => setTurboMode(false), 12_000)
  }

  // ── Hack egg: type out terminal lines one by one
  function triggerHack() {
    setHackLines([])
    activate('hack', 7_000)
    let i = 0
    const next = () => {
      setHackLines((prev) => [...prev, HACK_LINES[i]])
      i++
      if (i < HACK_LINES.length) setTimeout(next, 420 + Math.random() * 180)
    }
    setTimeout(next, 300)
  }

  // ── Keyboard listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't fire while typing in an input
      if (document.activeElement?.tagName === 'INPUT') return

      bufferRef.current = [...bufferRef.current, e.key].slice(-MAX_BUFFER)

      if (matchesEnd(KONAMI)) { triggerTurbo(); bufferRef.current = [] }
      else if (matchesEnd(WARP)) { activate('warp', 4_000); bufferRef.current = [] }
      else if (matchesEnd(NOVA)) { activate('nova', 3_500); bufferRef.current = [] }
      else if (matchesEnd(HACK)) { triggerHack(); bufferRef.current = [] }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AnimatePresence mode="wait">

      {/* ── TURBO MODE ──────────────────────────────────────────────────── */}
      {activeEgg === 'turbo' && (
        <motion.div
          key="turbo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Pulsing border flash */}
          <motion.div
            animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] }}
            style={{
              position: 'absolute', inset: 0,
              border: '2px solid #ffaa00',
              pointerEvents: 'none',
            }}
          />

          <motion.div
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 12, times: [0, 0.05, 0.85, 1] }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.55rem', letterSpacing: '0.35em',
              color: 'rgba(255,170,0,0.5)', marginBottom: '0.4rem',
            }}>
              ◈ CHEAT CODE ACCEPTED
            </div>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '1.4rem', letterSpacing: '0.2em',
              color: '#ffaa00',
              textShadow: '0 0 20px #ffaa00, 0 0 40px rgba(255,170,0,0.5)',
            }}>
              ⚡ TURBO MODE
            </div>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.6rem', letterSpacing: '0.15em',
              color: 'rgba(255,170,0,0.55)', marginTop: '0.4rem',
            }}>
              ORBITAL SPEED × 5 — 12 SECONDS
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── WARP ────────────────────────────────────────────────────────── */}
      {activeEgg === 'warp' && (
        <motion.div
          key="warp"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Radial streaks */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 30, opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeIn' }}
            style={{
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,220,255,0.25) 0%, rgba(100,180,255,0.12) 40%, transparent 70%)',
            }}
          />
          {/* Warp text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, times: [0, 0.15, 0.7, 1] }}
            style={{
              position: 'absolute',
              fontFamily: '"Share Tech Mono", monospace',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(150,200,255,0.6)', marginBottom: '0.4rem' }}>
              ◈ WARP DRIVE ENGAGED
            </div>
            <div style={{
              fontSize: '1.3rem', letterSpacing: '0.25em', color: '#aaddff',
              textShadow: '0 0 20px #aaddff, 0 0 60px rgba(100,180,255,0.4)',
            }}>
              JUMP INITIATED
            </div>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(150,200,255,0.4)', marginTop: '0.4rem' }}
            >
              HOLD ON...
            </motion.div>
          </motion.div>

          {/* Streak lines — CSS class-based */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * 360
            const len = 80 + Math.random() * 200
            return (
              <motion.div
                key={i}
                initial={{ scaleX: 0, opacity: 0.8 }}
                animate={{ scaleX: 1, opacity: 0 }}
                transition={{ duration: 2.0 + Math.random() * 0.8, ease: 'easeIn', delay: Math.random() * 0.3 }}
                style={{
                  position: 'absolute',
                  width: len, height: 1,
                  background: `linear-gradient(90deg, transparent, rgba(180,220,255,${0.3 + Math.random() * 0.4}), transparent)`,
                  transformOrigin: 'left center',
                  transform: `rotate(${angle}deg)`,
                  left: '50%', top: '50%',
                }}
              />
            )
          })}
        </motion.div>
      )}

      {/* ── NOVA ────────────────────────────────────────────────────────── */}
      {activeEgg === 'nova' && (
        <motion.div
          key="nova"
          style={{
            position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Flash */}
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at center, rgba(255,220,100,0.35) 0%, rgba(255,100,20,0.2) 40%, transparent 70%)',
            }}
          />
          {/* Warning UI */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.5, times: [0, 0.1, 0.75, 1] }}
            style={{ textAlign: 'center', zIndex: 1 }}
          >
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: 5, duration: 0.35 }}
              style={{
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.6rem', letterSpacing: '0.3em',
                color: '#ff6600', marginBottom: '0.5rem',
              }}
            >
              ⚠ WARNING ⚠
            </motion.div>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '1.2rem', letterSpacing: '0.15em',
              color: '#ffaa44',
              textShadow: '0 0 20px #ff6600, 0 0 40px rgba(255,100,0,0.6)',
            }}>
              SOLAR FLARE DETECTED
            </div>
            <div style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.6rem', letterSpacing: '0.12em',
              color: 'rgba(255,150,50,0.6)', marginTop: '0.5rem', lineHeight: 2,
            }}>
              <div>RADIATION LEVEL: EXTREME</div>
              <div>SHIELDS: ACTIVE</div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── HACK ────────────────────────────────────────────────────────── */}
      {activeEgg === 'hack' && (
        <motion.div
          key="hack"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', bottom: '5rem', right: '1.5rem',
            zIndex: 300, pointerEvents: 'none',
            width: 340,
            border: '1px solid rgba(0,255,80,0.3)',
            background: 'rgba(0,8,0,0.92)',
            padding: '0.9rem 1rem',
            fontFamily: '"Share Tech Mono", monospace',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Terminal header */}
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.2em',
            color: 'rgba(0,255,80,0.4)', borderBottom: '1px solid rgba(0,255,80,0.1)',
            paddingBottom: '0.4rem', marginBottom: '0.6rem',
          }}>
            SOLAR.SYS — SECURE TERMINAL v1.0
          </div>
          {/* Typed lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {hackLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: '0.62rem',
                  color: line.includes('GRANTED') || line.includes('WELCOME')
                    ? '#00ff50'
                    : line.includes('WARNING') || line.includes('ERROR')
                    ? '#ff4444'
                    : 'rgba(0,220,60,0.7)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.7,
                }}
              >
                {line}
              </motion.div>
            ))}
            {/* Blinking cursor */}
            {hackLines.length < HACK_LINES.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                style={{ fontSize: '0.7rem', color: '#00ff50', lineHeight: 1 }}
              >
                _
              </motion.span>
            )}
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  )
}
