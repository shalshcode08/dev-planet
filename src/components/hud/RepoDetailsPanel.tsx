import { motion, type Variants } from 'framer-motion'
import { useSpaceStore } from '@/store/useSpaceStore'

const panelVariants: Variants = {
  hidden: { opacity: 0, x: 100, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      delay: 0.8, // Wait for camera to fly in
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    filter: 'blur(4px)',
    transition: { duration: 0.3 },
  },
}

export function RepoDetailsPanel() {
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const enrichedRepos = useSpaceStore((s) => s.enrichedRepos)
  const setSelected = useSpaceStore((s) => s.setSelectedPlanet)

  if (!selectedId) return null

  const repo = enrichedRepos.find((r) => r.fullName === selectedId)
  if (!repo) return null

  // Calculate lines of code
  const linesOfCode = repo.languages.reduce((acc, lang) => acc + lang.bytes, 0)

  return (
    <motion.div
      key={selectedId}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '100%',
        background: 'linear-gradient(to left, rgba(0, 10, 20, 0.95), rgba(0, 10, 20, 0))',
        borderLeft: '1px solid rgba(0, 200, 255, 0.2)',
        padding: '4rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2rem',
        zIndex: 100,
        pointerEvents: 'auto',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#00ccff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#00ffaa' }}>
          ◈ TARGET SECURED
        </div>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'normal', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {repo.name}
        </h2>
        {repo.description && (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, marginTop: '0.5rem' }}>
            {repo.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <StatRow label="PLANET TYPE" value={repo.planetType.toUpperCase()} color="#00ccff" />
        <StatRow label="PRIMARY LANG" value={repo.language || 'UNKNOWN'} />
        <StatRow label="LINES OF CODE" value={linesOfCode.toLocaleString()} />
        <StatRow label="TOTAL COMMITS" value={repo.commits.toString()} />
        <StatRow label="PULL REQUESTS" value={(repo.openPRs + repo.closedPRs).toString()} />
        <StatRow label="OPEN ISSUES" value={repo.openIssues.toString()} />
        <StatRow label="STARS" value={repo.stars.toString()} color="#ffaa00" />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '0.8rem',
            textAlign: 'center',
            background: 'rgba(0, 200, 255, 0.1)',
            border: '1px solid rgba(0, 200, 255, 0.4)',
            color: '#00ccff',
            textDecoration: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 200, 255, 0.2)'
            e.currentTarget.style.borderColor = '#00ccff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 200, 255, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.4)'
          }}
        >
          ⬡ GITHUB
        </a>
        <button
          onClick={() => setSelected(null)}
          style={{
            flex: 1,
            padding: '0.8rem',
            textAlign: 'center',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          ✕ RELEASE
        </button>
      </div>
    </motion.div>
  )
}

function StatRow({ label, value, color = '#fff' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 200, 255, 0.1)', paddingBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'rgba(0, 200, 255, 0.6)', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <span style={{ fontSize: '1.1rem', color, letterSpacing: '0.05em' }}>
        {value}
      </span>
    </div>
  )
}
