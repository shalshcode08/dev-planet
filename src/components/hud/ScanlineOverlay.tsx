export function ScanlineOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 200,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 2px,
          rgba(0, 0, 0, 0.05) 2px,
          rgba(0, 0, 0, 0.05) 4px
        )`,
        backgroundSize: '100% 4px',
      }}
    />
  )
}
