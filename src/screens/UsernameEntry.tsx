import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSpaceStore, type RepoSummary } from '@/store/useSpaceStore'

const BOOT_LINES = [
  'SOLAR.SYS v2.0 — PORTFOLIO ENGINE',
  'Initializing navigation array...',
  'Connecting to GitHub telemetry...',
  'Awaiting pilot authentication...',
]

export function UsernameEntry() {
  const [input, setInput] = useState('')
  const [bootDone, setBootDone] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const setUsername = useSpaceStore((s) => s.setGithubUsername)
  const setAllRepos = useSpaceStore((s) => s.setAllRepos)
  const setPhase = useSpaceStore((s) => s.setAppPhase)

  // Boot sequence
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setVisibleLines(i)
      if (i >= BOOT_LINES.length) {
        clearInterval(id)
        setTimeout(() => setBootDone(true), 300)
      }
    }, 400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (bootDone) inputRef.current?.focus()
  }, [bootDone])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const username = input.trim()
    if (!username) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
      if (res.status === 404) {
        setError(`USER "${username.toUpperCase()}" NOT FOUND IN REGISTRY`)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError(`TELEMETRY ERROR: ${res.status}`)
        setLoading(false)
        return
      }
      const data = await res.json() as Array<{
        id: number; name: string; full_name: string; description: string | null
        language: string | null; stargazers_count: number; forks_count: number
        open_issues_count: number; html_url: string; topics: string[]
        updated_at: string; private: boolean; default_branch: string
      }>
      const repos: RepoSummary[] = data
        .filter((r) => !r.private)
        .map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          openIssues: r.open_issues_count,
          htmlUrl: r.html_url,
          topics: r.topics ?? [],
          updatedAt: r.updated_at,
          isPrivate: r.private,
          defaultBranch: r.default_branch,
        }))
      setUsername(username)
      setAllRepos(repos)
      setPhase('repo-select')
    } catch {
      setError('NETWORK FAILURE — CHECK COMMS')
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000005',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Share Tech Mono", monospace', color: '#00ccff',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#00ccff 1px, transparent 1px), linear-gradient(90deg, #00ccff 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Corner decorations */}
      <CornerDeco position="top-left" />
      <CornerDeco position="top-right" />
      <CornerDeco position="bottom-left" />
      <CornerDeco position="bottom-right" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '560px', padding: '0 1.5rem' }}
      >
        {/* Boot log */}
        <div style={{ marginBottom: '2rem', fontSize: '0.65rem', letterSpacing: '0.08em', lineHeight: 2 }}>
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: i === 0 ? '#00ffaa' : 'rgba(0,200,255,0.5)' }}
            >
              {i === 0 ? line : `> ${line}`}
            </motion.div>
          ))}
        </div>

        {bootDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* Title */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                fontSize: '0.6rem', letterSpacing: '0.3em',
                color: 'rgba(0,200,255,0.4)', marginBottom: '0.5rem'
              }}>
                ◈ PILOT AUTHENTICATION
              </div>
              <div style={{ fontSize: '1.4rem', letterSpacing: '0.1em', color: '#00ffaa', fontWeight: 'normal' }}>
                ENTER GITHUB USERNAME
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{
                border: '1px solid rgba(0,200,255,0.3)',
                background: 'rgba(0,20,40,0.8)',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}>
                <span style={{ color: '#00ffaa', fontSize: '0.9rem' }}>{'>'}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError('') }}
                  placeholder="username"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={loading}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', color: '#00ccff', fontFamily: 'inherit',
                    fontSize: '1rem', letterSpacing: '0.08em',
                  }}
                />
                {loading && <Spinner />}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: '0.62rem', color: '#ff4444', letterSpacing: '0.08em', marginBottom: '0.5rem' }}
                >
                  ✕ {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  width: '100%', padding: '0.65rem',
                  background: input.trim() && !loading ? 'rgba(0,200,255,0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: input.trim() && !loading ? 'rgba(0,200,255,0.6)' : 'rgba(0,200,255,0.2)',
                  color: input.trim() && !loading ? '#00ccff' : 'rgba(0,200,255,0.3)',
                  fontFamily: 'inherit', fontSize: '0.7rem', letterSpacing: '0.25em',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  marginTop: '0.25rem',
                }}
              >
                {loading ? 'SCANNING REGISTRY...' : 'INITIALIZE SYSTEM  →'}
              </button>
            </form>

            <div style={{
              marginTop: '1.5rem', fontSize: '0.58rem',
              color: 'rgba(0,200,255,0.25)', letterSpacing: '0.08em', lineHeight: 1.8
            }}>
              <div>↑ public repositories will be scanned</div>
              <div>↑ select up to 8 to form your solar system</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function CornerDeco({ position }: { position: string }) {
  const isTop = position.startsWith('top')
  const isLeft = position.endsWith('left')
  return (
    <div style={{
      position: 'absolute',
      top: isTop ? '1.5rem' : undefined,
      bottom: !isTop ? '1.5rem' : undefined,
      left: isLeft ? '1.5rem' : undefined,
      right: !isLeft ? '1.5rem' : undefined,
      width: 30, height: 30,
      borderTop: isTop ? '1px solid rgba(0,200,255,0.2)' : undefined,
      borderBottom: !isTop ? '1px solid rgba(0,200,255,0.2)' : undefined,
      borderLeft: isLeft ? '1px solid rgba(0,200,255,0.2)' : undefined,
      borderRight: !isLeft ? '1px solid rgba(0,200,255,0.2)' : undefined,
    }} />
  )
}

function Spinner() {
  const frames = ['◐', '◓', '◑', '◒']
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % frames.length), 150)
    return () => clearInterval(id)
  }, [frames.length])
  return <span style={{ color: '#00ffaa', fontSize: '0.8rem' }}>{frames[i]}</span>
}
