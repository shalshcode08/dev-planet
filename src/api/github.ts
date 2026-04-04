import axios from 'axios'
import type { RepoSummary, LanguageStat } from '@/store/useSpaceStore'

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined

export const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
  }
})

function extractPageCountFromLink(linkHeader?: string): number {
  if (!linkHeader) return 1
  const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/)
  return match ? parseInt(match[1]) : 1
}

export async function fetchUserRepos(username: string): Promise<RepoSummary[]> {
  const { data } = await githubApi.get(`/users/${username}/repos`, {
    params: { per_page: 100, sort: 'updated' }
  })
  return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((r: any) => !r.private)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({
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
}

export async function fetchRepoLanguages(fullName: string): Promise<LanguageStat[]> {
  try {
    const { data } = await githubApi.get<Record<string, number>>(`/repos/${fullName}/languages`)
    return Object.entries(data)
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
  } catch {
    return []
  }
}

export async function fetchRepoOpenPRs(fullName: string): Promise<number> {
  try {
    const res = await githubApi.get(`/repos/${fullName}/pulls`, {
      params: { state: 'open', per_page: 1 }
    })
    const link = res.headers.link as string | undefined
    if (!link) {
      return Array.isArray(res.data) ? res.data.length : 0
    }
    return extractPageCountFromLink(link)
  } catch {
    return 0
  }
}

export async function fetchRepoCommits(fullName: string): Promise<number> {
  try {
    const res = await githubApi.get(`/repos/${fullName}/commits`, {
      params: { per_page: 1 }
    })
    const link = res.headers.link as string | undefined
    return extractPageCountFromLink(link)
  } catch {
    return 1
  }
}
