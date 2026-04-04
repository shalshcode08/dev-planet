export type PlanetType = 'lava' | 'gas' | 'ice' | 'ocean' | 'desert'

export interface ProjectConfig {
  id: string
  githubRepo: string // owner/repo
  planetType: PlanetType
  orbitRadius: number
  orbitSpeed: number  // radians per second
  planetSize: number
  orbitTilt: number   // X-axis tilt of orbit plane in radians
  initialAngle: number
  liveUrl?: string
}

export const GITHUB_USER = 'somyaranjan26'

export const projects: ProjectConfig[] = [
  {
    id: 'easyhunt',
    githubRepo: `${GITHUB_USER}/easy-hunt`,
    planetType: 'gas',
    orbitRadius: 14,
    orbitSpeed: 0.08,
    planetSize: 1.8,
    orbitTilt: 0.1,
    initialAngle: 0,
    liveUrl: 'https://easyhunt.space',
  },
  {
    id: 'git-banner',
    githubRepo: `${GITHUB_USER}/git-banner-backend`,
    planetType: 'ice',
    orbitRadius: 8,
    orbitSpeed: 0.14,
    planetSize: 0.9,
    orbitTilt: 0.05,
    initialAngle: Math.PI * 0.5,
  },
  {
    id: 'track-down',
    githubRepo: `${GITHUB_USER}/track-down`,
    planetType: 'ocean',
    orbitRadius: 11,
    orbitSpeed: 0.11,
    planetSize: 1.1,
    orbitTilt: -0.08,
    initialAngle: Math.PI,
    liveUrl: 'https://trackdown.space',
  },
  {
    id: 'rt-chat',
    githubRepo: `${GITHUB_USER}/rt-chat`,
    planetType: 'lava',
    orbitRadius: 6,
    orbitSpeed: 0.2,
    planetSize: 0.8,
    orbitTilt: 0.15,
    initialAngle: Math.PI * 1.5,
  },
  {
    id: 'term-note',
    githubRepo: `${GITHUB_USER}/term-note`,
    planetType: 'desert',
    orbitRadius: 18,
    orbitSpeed: 0.06,
    planetSize: 0.95,
    orbitTilt: -0.12,
    initialAngle: Math.PI * 0.25,
  },
  {
    id: 'go-apis',
    githubRepo: `${GITHUB_USER}/Go-APIs`,
    planetType: 'gas',
    orbitRadius: 22,
    orbitSpeed: 0.045,
    planetSize: 1.5,
    orbitTilt: 0.07,
    initialAngle: Math.PI * 0.75,
  },
]
