import { GitHubRepo, GitHubLanguages, ProcessedRepo, ActivitySegment } from "./types";
import { fetchRepoLanguages, fetchRepoCommitDates } from "./github";

const INACTIVITY_THRESHOLD_DAYS = 60;
const GAP_THRESHOLD_DAYS = 90; // Gaps > 90 days create separate segments

/**
 * Filter repos:
 * - Ignore forks
 * - Ignore archived repos
 */
export function filterRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos.filter((repo) => !repo.fork && !repo.archived);
}

/**
 * Determine primary + secondary language from a language byte map.
 */
function extractLanguages(languages: GitHubLanguages): {
  primary: string;
  secondary: string | null;
} {
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return { primary: "Unknown", secondary: null };
  return {
    primary: sorted[0][0],
    secondary: sorted.length > 1 ? sorted[1][0] : null,
  };
}

/**
 * Determine if a project is "ongoing" (active within the last 60 days).
 */
function isProjectOngoing(updatedAt: string, pushedAt: string): boolean {
  const lastActivity = new Date(
    Math.max(new Date(updatedAt).getTime(), new Date(pushedAt).getTime())
  );
  const now = new Date();
  const diffDays =
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= INACTIVITY_THRESHOLD_DAYS;
}

/**
 * Build activity segments from commit dates.
 * Commits are expected newest-first. Groups commits into continuous
 * segments separated by gaps > GAP_THRESHOLD_DAYS.
 */
function buildActivitySegments(
  commitDates: string[],
  repoCreatedAt: Date,
  repoEndDate: Date
): ActivitySegment[] {
  if (commitDates.length === 0) {
    // No commit data available — treat entire range as one segment
    return [{ start: repoCreatedAt, end: repoEndDate }];
  }

  // Parse and sort dates oldest → newest
  const dates = commitDates
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return [{ start: repoCreatedAt, end: repoEndDate }];
  }

  const segments: ActivitySegment[] = [];
  let segStart = dates[0];
  let segEnd = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const gapDays =
      (dates[i].getTime() - segEnd.getTime()) / (1000 * 60 * 60 * 24);

    if (gapDays > GAP_THRESHOLD_DAYS) {
      // Close current segment and start new one
      segments.push({ start: segStart, end: segEnd });
      segStart = dates[i];
    }
    segEnd = dates[i];
  }

  // Close final segment
  segments.push({ start: segStart, end: segEnd });

  return segments;
}

/**
 * Process and enrich repos into timeline-ready data.
 * Now fetches commit dates to detect real activity gaps.
 */
export async function processRepos(
  repos: GitHubRepo[],
  username: string,
  maxRepos: number = 20
): Promise<ProcessedRepo[]> {
  const filtered = filterRepos(repos);

  // Fetch languages + commit dates in parallel for all repos
  const enrichPromises = filtered.map(async (repo) => {
    const [languages, commitDates] = await Promise.all([
      fetchRepoLanguages(username, repo.name).catch(() => ({} as GitHubLanguages)),
      fetchRepoCommitDates(username, repo.name).catch(() => [] as string[]),
    ]);
    return { languages, commitDates };
  });

  const enriched = await Promise.all(enrichPromises);

  // Build processed repos
  let processed: ProcessedRepo[] = filtered.map((repo, i) => {
    const { primary, secondary } = extractLanguages(enriched[i].languages);
    const ongoing = isProjectOngoing(repo.updated_at, repo.pushed_at);

    const endDate = ongoing
      ? new Date()
      : new Date(
          Math.max(
            new Date(repo.updated_at).getTime(),
            new Date(repo.pushed_at).getTime()
          )
        );

    const startDate = new Date(repo.created_at);
    const segments = buildActivitySegments(
      enriched[i].commitDates,
      startDate,
      endDate
    );

    return {
      name: repo.name,
      startDate,
      endDate,
      isOngoing: ongoing,
      primaryLanguage: primary,
      secondaryLanguage: secondary,
      stars: repo.stargazers_count,
      description: repo.description,
      url: repo.html_url,
      segments,
    };
  });

  // Filter out trivial repos (< 1 day lifespan AND no stars AND not ongoing)
  processed = processed.filter((repo) => {
    const durationDays =
      (repo.endDate.getTime() - repo.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return repo.stars > 0 || durationDays > 1 || repo.isOngoing;
  });

  // Sort by stars desc, then by start date asc
  processed.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return a.startDate.getTime() - b.startDate.getTime();
  });

  return processed.slice(0, maxRepos);
}
