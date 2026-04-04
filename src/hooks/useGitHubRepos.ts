import { useEffect } from 'react'
import { useSpaceStore, type GitHubRepo } from '@/store/useSpaceStore'
import { projects, GITHUB_USER } from '@/data/projects'

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined

async function fetchRepo(repo: string): Promise<GitHubRepo | null> {
  const headers: HeadersInit = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers })
    if (!res.ok) return null
    const data = await res.json() as {
      name: string
      description: string | null
      stargazers_count: number
      language: string | null
      topics: string[]
      html_url: string
    }
    return {
      name: data.name,
      description: data.description,
      stargazers_count: data.stargazers_count,
      language: data.language,
      topics: data.topics ?? [],
      html_url: data.html_url,
    }
  } catch {
    return null
  }
}

export function useGitHubRepos() {
  const setGithubData = useSpaceStore((s) => s.setGithubData)

  useEffect(() => {
    async function load() {
      const repoNames = projects.map((p) => p.githubRepo)
      // Also try fetching all repos to get everything
      const headers: HeadersInit = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}
      const allRes = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`,
        { headers }
      )
      let allRepos: Record<string, GitHubRepo> = {}
      if (allRes.ok) {
        const all = await allRes.json() as Array<{
          name: string
          full_name: string
          description: string | null
          stargazers_count: number
          language: string | null
          topics: string[]
          html_url: string
        }>
        for (const r of all) {
          allRepos[r.full_name.toLowerCase()] = {
            name: r.name,
            description: r.description,
            stargazers_count: r.stargazers_count,
            language: r.language,
            topics: r.topics ?? [],
            html_url: r.html_url,
          }
        }
      } else {
        // Fallback: fetch individually
        await Promise.all(
          repoNames.map(async (repo) => {
            const data = await fetchRepo(repo)
            if (data) allRepos[repo.toLowerCase()] = data
          })
        )
      }
      setGithubData(allRepos)
    }
    void load()
  }, [setGithubData])
}
