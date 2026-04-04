import { useSpaceStore } from '@/store/useSpaceStore'

export function TargetReticle() {
  const hoveredId = useSpaceStore((s) => s.hoveredPlanetId)

  if (!hoveredId) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <svg width="100%" height="100%">
        <circle
          cx="50%"
          cy="50%"
          r="40"
          fill="none"
          stroke="#00ccff"
          strokeWidth="1"
          opacity="0.6"
          style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
        />
        <circle
          cx="50%"
          cy="50%"
          r="55"
          fill="none"
          stroke="#00ccff"
          strokeWidth="0.5"
          opacity="0.3"
          style={{ animation: 'pulse 1.5s ease-in-out infinite 0.4s' }}
        />
        <line x1="calc(50% - 70px)" y1="50%" x2="calc(50% - 50px)" y2="50%" stroke="#00ccff" strokeWidth="1" opacity="0.7" />
        <line x1="calc(50% + 50px)" y1="50%" x2="calc(50% + 70px)" y2="50%" stroke="#00ccff" strokeWidth="1" opacity="0.7" />
        <line x1="50%" y1="calc(50% - 70px)" x2="50%" y2="calc(50% - 50px)" stroke="#00ccff" strokeWidth="1" opacity="0.7" />
        <line x1="50%" y1="calc(50% + 50px)" x2="50%" y2="calc(50% + 70px)" stroke="#00ccff" strokeWidth="1" opacity="0.7" />
      </svg>
    </div>
  )
}
