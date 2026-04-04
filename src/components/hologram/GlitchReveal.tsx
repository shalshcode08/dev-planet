import { motion, type Variants } from 'framer-motion'
import { useSpaceStore } from '@/store/useSpaceStore'
import { projects } from '@/data/projects'

const glitch: Variants = {
  hidden: { opacity: 0, x: -20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      delay: 0.6,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    filter: 'blur(4px)',
    transition: { duration: 0.2 },
  },
}

export function GlitchReveal() {
  const selectedId = useSpaceStore((s) => s.selectedPlanetId)
  const githubData = useSpaceStore((s) => s.githubData)
  const setSelected = useSpaceStore((s) => s.setSelectedPlanet)

  if (!selectedId) return null

  const config = projects.find((p) => p.id === selectedId)
  if (!config) return null

  const repo = githubData[config.githubRepo.toLowerCase()]

  return (
    <motion.div
      key={selectedId}
      variants={glitch}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed',
        bottom: '2.5rem',
        right: '2rem',
        display: 'flex',
        gap: '0.75rem',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {repo?.html_url && (
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hud-link"
        >
          ⬡ GITHUB
        </a>
      )}
      {config.liveUrl && (
        <a
          href={config.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hud-link hud-link--green"
        >
          ⬡ LAUNCH
        </a>
      )}
      <button
        onClick={() => setSelected(null)}
        className="hud-link hud-link--dim"
      >
        ✕ CLOSE
      </button>
    </motion.div>
  )
}
