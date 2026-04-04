import type { PlanetType } from '@/store/useSpaceStore'

const LANGUAGE_MAP: Record<string, PlanetType> = {
  TypeScript: 'ocean',
  JavaScript: 'ocean',
  Vue: 'ocean',
  CSS: 'ocean',
  HTML: 'ocean',
  Go: 'ice',
  Rust: 'ice',
  Dart: 'ice',
  Elixir: 'ice',
  Clojure: 'ice',
  Python: 'gas',
  Swift: 'gas',
  Kotlin: 'gas',
  Scala: 'gas',
  R: 'gas',
  Java: 'lava',
  'C++': 'lava',
  C: 'lava',
  'C#': 'lava',
  Ruby: 'lava',
  Perl: 'lava',
  PHP: 'desert',
  Shell: 'desert',
  PowerShell: 'desert',
  Makefile: 'desert',
  Dockerfile: 'desert',
}

const FALLBACK_CYCLE: PlanetType[] = ['ocean', 'lava', 'gas', 'ice', 'desert', 'lava', 'ocean', 'gas']

export function getPlanetType(language: string | null, index: number): PlanetType {
  if (language && LANGUAGE_MAP[language]) return LANGUAGE_MAP[language]
  return FALLBACK_CYCLE[index % FALLBACK_CYCLE.length]
}

const ORBIT_RADII =  [6,   8.5, 11.5, 15,  18.5, 22,  26,  30]
const ORBIT_SPEEDS = [0.20, 0.14, 0.11, 0.08, 0.065, 0.05, 0.04, 0.033]
const ORBIT_TILTS =  [0.15, 0.05, -0.08, 0.10, -0.12, 0.07, -0.05, 0.12]
const PLANET_SIZES = [0.80, 0.90, 1.10, 1.70, 0.95, 1.50, 1.00, 1.20]

export function getOrbitConfig(index: number) {
  const i = Math.min(index, 7)
  return {
    orbitRadius: ORBIT_RADII[i],
    orbitSpeed:  ORBIT_SPEEDS[i],
    orbitTilt:   ORBIT_TILTS[i],
    initialAngle: (index / 8) * Math.PI * 2,
    planetSize:  PLANET_SIZES[i],
  }
}
