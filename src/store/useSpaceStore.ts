import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanetType = 'lava' | 'gas' | 'ice' | 'ocean' | 'desert'

export interface RepoSummary {
  id: number
  name: string
  fullName: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  openIssues: number
  htmlUrl: string
  topics: string[]
  updatedAt: string
  isPrivate: boolean
  defaultBranch: string
}

export interface LanguageStat {
  name: string
  bytes: number
}

export interface EnrichedRepo extends RepoSummary {
  commits: number
  openPRs: number
  closedPRs: number
  languages: LanguageStat[]
  planetType: PlanetType
  orbitRadius: number
  orbitSpeed: number
  orbitTilt: number
  initialAngle: number
  planetSize: number
}

export interface FakeCoords {
  x: number
  y: number
  z: number
  sector: string
}

interface SpaceStore {
  githubUsername: string
  allRepos: RepoSummary[]
  selectedRepoNames: string[]   // repo fullNames selected by user
  enrichedRepos: EnrichedRepo[] // final data used by solar system
  selectedPlanetId: string | null
  hoveredPlanetId: string | null
  isAnimating: boolean
  fakeCoords: FakeCoords
  generatingProgress: number     // 0-100
  generatingLog: string[]

  setGithubUsername: (name: string) => void
  setAllRepos: (repos: RepoSummary[]) => void
  toggleRepoSelection: (fullName: string) => void
  setEnrichedRepos: (repos: EnrichedRepo[]) => void
  setSelectedPlanet: (id: string | null) => void
  setHoveredPlanet: (id: string | null) => void
  setAnimating: (val: boolean) => void
  setFakeCoords: (coords: FakeCoords) => void
  setGeneratingProgress: (n: number) => void
  appendGeneratingLog: (line: string) => void
  resetGenerating: () => void
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set) => ({
      githubUsername: '',
      allRepos: [],
      selectedRepoNames: [],
      enrichedRepos: [],
      selectedPlanetId: null,
      hoveredPlanetId: null,
      isAnimating: false,
      fakeCoords: { x: 0, y: 12, z: 32, sector: '7G' },
      generatingProgress: 0,
      generatingLog: [],

      setGithubUsername: (name) => set({ githubUsername: name }),
      setAllRepos: (repos) => set({ allRepos: repos }),
      toggleRepoSelection: (fullName) =>
        set((s) => {
          const already = s.selectedRepoNames.includes(fullName)
          if (!already && s.selectedRepoNames.length >= 8) return s
          return {
            selectedRepoNames: already
              ? s.selectedRepoNames.filter((n) => n !== fullName)
              : [...s.selectedRepoNames, fullName],
          }
        }),
      setEnrichedRepos: (repos) => set({ enrichedRepos: repos }),
      setSelectedPlanet: (id) => set({ selectedPlanetId: id }),
      setHoveredPlanet: (id) => set({ hoveredPlanetId: id }),
      setAnimating: (val) => set({ isAnimating: val }),
      setFakeCoords: (coords) => set({ fakeCoords: coords }),
      setGeneratingProgress: (n) => set({ generatingProgress: n }),
      appendGeneratingLog: (line) =>
        set((s) => ({ generatingLog: [...s.generatingLog.slice(-12), line] })),
      resetGenerating: () => set({ generatingProgress: 0, generatingLog: [] }),
    }),
    {
      name: 'solar-sys-storage',
      partialize: (state) => ({
        githubUsername: state.githubUsername,
        allRepos: state.allRepos,
        selectedRepoNames: state.selectedRepoNames,
        enrichedRepos: state.enrichedRepos,
      }),
    }
  )
)
