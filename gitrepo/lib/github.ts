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

/**
 * Fetch commit dates for a repo to detect actual activity periods.
 * Returns an array of commit date strings + message text for keyword analysis.
 * Only fetches up to 100 commits (most recent).
 */
export async function fetchRepoCommits(
  owner: string,
  repo: string
): Promise<{ date: string; message: string }[]> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=100`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const commits = (await response.json()) as Array<{
    commit: { author: { date: string }; message: string };
  }>;

  return commits
    .map((c) => ({
      date: c.commit?.author?.date ?? "",
      message: c.commit?.message ?? "",
    }))
    .filter((c) => c.date !== "");
}

/**
 * Check if a repo has a README file.
 */
export async function fetchRepoReadme(
  owner: string,
  repo: string
): Promise<boolean> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  return response.ok;
}

/**
 * Fetch count of tags for a repo (proxy for releases).
 */
export async function fetchRepoTagsCount(
  owner: string,
  repo: string
): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tags?per_page=1`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return 0;

  const tags = (await response.json()) as unknown[];
  return tags.length;
}

// Keep backward compat alias
export async function fetchRepoCommitDates(
  owner: string,
  repo: string
): Promise<string[]> {
  const commits = await fetchRepoCommits(owner, repo);
  return commits.map((c) => c.date);
}

/**
 * Fetch the root-level directory listing of a repo.
 * Returns file/dir names with their type for structure analysis.
 */
export async function fetchRepoRootContents(
  owner: string,
  repo: string
): Promise<{ name: string; type: string }[]> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const items = (await response.json()) as Array<{ name: string; type: string }>;
  return items.map((item) => ({ name: item.name, type: item.type }));
}

/**
 * Fetch README content with metadata for quality scoring.
 * Returns existence, content length, and whether usage/install sections exist.
 */
export async function fetchRepoReadmeContent(
  owner: string,
  repo: string
): Promise<{ exists: boolean; length: number; hasUsageSection: boolean }> {
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;

  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return { exists: false, length: 0, hasUsageSection: false };

  const data = (await response.json()) as {
    content?: string;
    encoding?: string;
    size?: number;
  };

  let content = "";
  let length = data.size ?? 0;

  if (data.content && data.encoding === "base64") {
    try {
      content = Buffer.from(data.content, "base64").toString("utf-8");
      length = content.length;
    } catch {
      // fallback to size field
    }
  }

  const usageKeywords = [
    "usage",
    "install",
    "getting started",
    "setup",
    "how to use",
    "quick start",
    "documentation",
    "example",
    "demo",
    "tutorial",
    "prerequisites",
    "requirements",
    "configuration",
  ];
  const lowerContent = content.toLowerCase();
  const hasUsageSection = usageKeywords.some((kw) => lowerContent.includes(kw));

  return { exists: true, length, hasUsageSection };
}
