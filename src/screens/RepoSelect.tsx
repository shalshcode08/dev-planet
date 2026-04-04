import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpaceStore } from '@/store/useSpaceStore'
import { useNavigate, Navigate } from 'react-router-dom'
import { getPlanetType } from '@/data/planetTypes'

const PLANET_COLORS: Record<string, string> = {
  lava: '#ff4400',
  gas: '#ffaa44',
  ice: '#44ddff',
  ocean: '#0066ff',
  desert: '#cc8844',
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f0db4f', Python: '#3572a5',
  Go: '#00add8', Rust: '#dea584', Java: '#ed8b00', 'C++': '#f34b7d',
  C: '#555555', 'C#': '#239120', Ruby: '#701516', PHP: '#777bb4',
  Shell: '#89e051', Swift: '#f05138', Kotlin: '#7f52ff', Dart: '#00b4ab',
  HTML: '#e34c26', CSS: '#563d7c', Vue: '#42b883',
}

export function RepoSelect() {
  const username = useSpaceStore((s) => s.githubUsername)
  const repos = useSpaceStore((s) => s.allRepos)
  const selected = useSpaceStore((s) => s.selectedRepoNames)
  const toggle = useSpaceStore((s) => s.toggleRepoSelection)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  if (!username) return <Navigate to="/" replace />

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleLaunch() {
    if (selected.length === 0) return
    navigate('/generating')
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000005',
      fontFamily: '"Share Tech Mono", monospace', color: '#00ccff',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#00ccff 1px, transparent 1px), linear-gradient(90deg, #00ccff 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid rgba(0,200,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(0,200,255,0.4)', letterSpacing: '0.2em', marginBottom: '0.2rem' }}>
            ◈ REPO SCANNER — @{username.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.95rem', letterSpacing: '0.08em', color: '#00ffaa' }}>
            SELECT PLANETS ({selected.length}/8)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{
            border: '1px solid rgba(0,200,255,0.2)',
            background: 'rgba(0,20,40,0.6)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
          }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(0,200,255,0.4)' }}>{'~'}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter repos..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#00ccff', fontFamily: 'inherit', fontSize: '0.7rem',
                width: '160px', letterSpacing: '0.05em',
              }}
            />
          </div>

          {/* Launch button */}
          <motion.button
            onClick={handleLaunch}
            disabled={selected.length === 0}
            whileHover={selected.length > 0 ? { scale: 1.02 } : {}}
            whileTap={selected.length > 0 ? { scale: 0.98 } : {}}
            style={{
              padding: '0.5rem 1.25rem',
              background: selected.length > 0 ? 'rgba(0,255,170,0.1)' : 'transparent',
              border: '1px solid',
              borderColor: selected.length > 0 ? 'rgba(0,255,170,0.5)' : 'rgba(0,200,255,0.15)',
              color: selected.length > 0 ? '#00ffaa' : 'rgba(0,200,255,0.2)',
              fontFamily: 'inherit', fontSize: '0.65rem', letterSpacing: '0.2em',
              cursor: selected.length > 0 ? 'pointer' : 'default',
            }}
          >
            LAUNCH MISSION →
          </motion.button>
        </div>
      </div>

      {/* Repo grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.75rem',
        alignContent: 'start',
      }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(0,200,255,0.3)', fontSize: '0.7rem', paddingTop: '3rem' }}>
            NO REPOSITORIES MATCH QUERY
          </div>
        )}
        {filtered.map((repo, idx) => {
          const isSelected = selected.includes(repo.fullName)
          const planetType = getPlanetType(repo.language, idx)
          const planetColor = PLANET_COLORS[planetType]
          const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#888') : '#555'
          const canSelect = isSelected || selected.length < 8

          return (
            <motion.div
              key={repo.id}
              onClick={() => canSelect && toggle(repo.fullName)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
              style={{
                border: '1px solid',
                borderColor: isSelected ? planetColor + '80' : 'rgba(0,200,255,0.12)',
                background: isSelected ? `${planetColor}0d` : 'rgba(0,10,25,0.6)',
                padding: '0.85rem 1rem',
                cursor: canSelect ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                position: 'relative',
                opacity: !canSelect ? 0.4 : 1,
              }}
            >
              {/* Selection indicator */}
              <div style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                width: 14, height: 14, borderRadius: '50%',
                border: `1px solid ${isSelected ? planetColor : 'rgba(0,200,255,0.25)'}`,
                background: isSelected ? planetColor : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.5rem', color: '#000',
              }}>
                {isSelected && '✓'}
              </div>

              {/* Planet type dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: planetColor,
                boxShadow: `0 0 6px ${planetColor}`,
                marginBottom: '0.5rem',
                display: 'inline-block',
              }} />

              {/* Repo name */}
              <div style={{
                fontSize: '0.8rem', letterSpacing: '0.05em',
                color: isSelected ? '#fff' : '#00ccff',
                marginBottom: '0.3rem',
                paddingRight: '1.5rem',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {repo.name}
              </div>

              {/* Description */}
              <div style={{
                fontSize: '0.62rem', color: 'rgba(0,200,255,0.45)',
                lineHeight: 1.5, marginBottom: '0.6rem',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '2.0em',
              }}>
                {repo.description ?? '—'}
              </div>

              {/* Footer stats */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.6rem' }}>
                {repo.language && (
                  <span style={{ color: langColor }}>
                    ● {repo.language}
                  </span>
                )}
                <span style={{ color: 'rgba(0,200,255,0.35)' }}>★ {repo.stars}</span>
                {repo.forks > 0 && (
                  <span style={{ color: 'rgba(0,200,255,0.35)' }}>⑂ {repo.forks}</span>
                )}
                <span style={{
                  marginLeft: 'auto',
                  color: `${planetColor}88`,
                  fontSize: '0.55rem', letterSpacing: '0.1em',
                }}>
                  {planetType.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '0.75rem 2rem',
        borderTop: '1px solid rgba(0,200,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.58rem', color: 'rgba(0,200,255,0.3)', flexShrink: 0,
      }}>
        <span>{repos.length} REPOSITORIES DETECTED</span>
        <span>MAX 8 PLANETS PER SOLAR SYSTEM</span>
      </div>
    </div>
  )
}
