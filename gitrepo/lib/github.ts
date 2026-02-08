import { GitHubRepo, GitHubLanguages } from "./types";

const GITHUB_API_BASE = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-readme-timeline",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch all public repos for a given GitHub username.
 * Paginates to collect all repos.
 */
export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (page <= 5) {
    // Max 500 repos (5 pages)
    const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=created&direction=asc&type=owner`;

    const response = await fetch(url, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`GitHub user "${username}" not found.`);
      }
      if (response.status === 403) {
        throw new Error(
          "GitHub API rate limit exceeded. Try again later or set GITHUB_TOKEN."
        );
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = (await response.json()) as GitHubRepo[];
    allRepos.push(...repos);

    if (repos.length < perPage) break;
    page++;
  }

  return allRepos;
}

/**
 * Fetch language breakdown for a specific repo.
 */
export async function fetchRepoLanguages(
  owner: string,
  repo: string
): Promise<GitHubLanguages> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return {};
  }

  return (await response.json()) as GitHubLanguages;
}

export interface CommitInfo {
  date: string;
}

/**
 * Fetch commit dates for a repo to detect actual activity periods.
 * Returns an array of commit dates (ISO strings), newest first.
 * Only fetches a sample (first + last page) to stay within rate limits.
 */
export async function fetchRepoCommitDates(
  owner: string,
  repo: string
): Promise<string[]> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=100`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const commits = (await response.json()) as Array<{
    commit: { author: { date: string } };
  }>;

  return commits
    .map((c) => c.commit?.author?.date)
    .filter((d): d is string => !!d);
}
