import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSpaceStore, type EnrichedRepo } from '@/store/useSpaceStore'
import { useNavigate, Navigate } from 'react-router-dom'
import { getPlanetType, getOrbitConfig } from '@/data/planetTypes'
import { fetchRepoLanguages, fetchRepoOpenPRs, fetchRepoCommits } from '@/api/github'


export function GeneratingScreen() {
  const allRepos = useSpaceStore((s) => s.allRepos)
  const selectedNames = useSpaceStore((s) => s.selectedRepoNames)
  const setEnrichedRepos = useSpaceStore((s) => s.setEnrichedRepos)
  const navigate = useNavigate()
  const setProgress = useSpaceStore((s) => s.setGeneratingProgress)
  const appendLog = useSpaceStore((s) => s.appendGeneratingLog)
  const progress = useSpaceStore((s) => s.generatingProgress)
  const logs = useSpaceStore((s) => s.generatingLog)
  const resetGenerating = useSpaceStore((s) => s.resetGenerating)
  const ran = useRef(false)

  if (selectedNames.length === 0) return <Navigate to="/select" replace />

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    resetGenerating()
    void run()
  }, [])

  async function run() {
    const selectedRepos = allRepos.filter((r) => selectedNames.includes(r.fullName))
    appendLog('> INITIALIZING ORBITAL MECHANICS ENGINE...')
    setProgress(5)
    await delay(300)
    appendLog('> LOADING STAR MAP...')
    setProgress(12)
    await delay(200)

    const enriched: EnrichedRepo[] = []
    const step = 80 / selectedRepos.length

    for (let i = 0; i < selectedRepos.length; i++) {
      const repo = selectedRepos[i]
      appendLog(`> SCANNING ${repo.name.toUpperCase()}...`)

      const [commits, languages, openPRs] = await Promise.all([
        fetchRepoCommits(repo.fullName),
        fetchRepoLanguages(repo.fullName),
        fetchRepoOpenPRs(repo.fullName),
      ])

      appendLog(`  ↳ ${commits} commits | ${languages[0]?.name ?? 'unknown'} | ${openPRs} open PRs`)

      const orbitConfig = getOrbitConfig(i)
      const planetType = getPlanetType(repo.language, i)

      enriched.push({
        ...repo,
        commits,
        openPRs,
        closedPRs: 0,
        languages,
        planetType,
        ...orbitConfig,
      })

      setProgress(12 + Math.round(step * (i + 1)))
      await delay(100)
    }

    appendLog('> CALCULATING GRAVITATIONAL CONSTANTS...')
    setProgress(92)
    await delay(300)
    appendLog('> RENDERING PLANETARY SURFACES...')
    setProgress(97)
    await delay(400)
    appendLog('> SOLAR SYSTEM READY.')
    setProgress(100)
    await delay(600)

    setEnrichedRepos(enriched)
    navigate('/system')
  }

  const barWidth = `${progress}%`

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000005',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Share Tech Mono", monospace', color: '#00ccff',
    }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#00ccff 1px, transparent 1px), linear-gradient(90deg, #00ccff 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '520px', padding: '0 2rem' }} className="generating-container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.6rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
            ◈ GENERATING SOLAR SYSTEM
          </div>
          <div style={{ fontSize: '1.1rem', letterSpacing: '0.08em', color: '#00ffaa' }}>
            CONSTRUCTING YOUR UNIVERSE...
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            height: '2px',
            background: 'rgba(0,200,255,0.1)',
            marginBottom: '0.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <motion.div
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, #00ffaa, #00ccff)',
                transformOrigin: 'left',
              }}
              animate={{ width: barWidth }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'rgba(0,200,255,0.4)' }}>
            <span>{'[' + '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5)) + ']'}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Console log */}
        <div style={{
          border: '1px solid rgba(0,200,255,0.1)',
          background: 'rgba(0,10,20,0.6)',
          padding: '0.75rem 1rem',
          height: '220px',
          overflowY: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          gap: '0.2rem',
        }} className="generating-console">
          {logs.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.04em',
                color: line.startsWith('  ↳') ? 'rgba(0,255,170,0.5)' :
                       line.includes('READY') ? '#00ffaa' :
                       'rgba(0,200,255,0.55)',
                lineHeight: 1.6,
              }}
            >
              {line}
            </motion.div>
          ))}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ fontSize: '0.7rem', color: '#00ffaa', lineHeight: 1 }}
          >
            _
          </motion.span>
        </div>
      </div>
    </div>
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
