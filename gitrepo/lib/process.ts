import { GitHubRepo, GitHubLanguages, ProcessedRepo } from "./types";
import { fetchRepoLanguages } from "./github";

const INACTIVITY_THRESHOLD_DAYS = 60;

/**
 * Filter repos based on the rules:
 * - Ignore forks
 * - Ignore archived repos
 */
export function filterRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos.filter((repo) => {
    if (repo.fork) return false;
    if (repo.archived) return false;
    return true;
  });
}

/**
 * Determine the primary and secondary language from a language map.
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
 * Process and enrich a list of repos into timeline-ready data.
 */
export async function processRepos(
  repos: GitHubRepo[],
  username: string,
  maxRepos: number = 8
): Promise<ProcessedRepo[]> {
  // Filter first
  const filtered = filterRepos(repos);

  // Fetch languages for all repos in parallel
  const languagePromises = filtered.map((repo) =>
    fetchRepoLanguages(username, repo.name).catch(() => ({} as GitHubLanguages))
  );
  const allLanguages = await Promise.all(languagePromises);

  // Build processed repos
  let processed: ProcessedRepo[] = filtered.map((repo, i) => {
    const { primary, secondary } = extractLanguages(allLanguages[i]);
    const ongoing = isProjectOngoing(repo.updated_at, repo.pushed_at);
    const endDate = ongoing
      ? new Date()
      : new Date(
          Math.max(
            new Date(repo.updated_at).getTime(),
            new Date(repo.pushed_at).getTime()
          )
        );

    return {
      name: repo.name,
      startDate: new Date(repo.created_at),
      endDate,
      isOngoing: ongoing,
      primaryLanguage: primary,
      secondaryLanguage: secondary,
      stars: repo.stargazers_count,
      description: repo.description,
      url: repo.html_url,
    };
  });

  // Filter repos with no meaningful content (less than 1 day lifespan AND no stars)
  // This replaces the commit-count check to avoid extra API calls
  processed = processed.filter((repo) => {
    const durationDays =
      (repo.endDate.getTime() - repo.startDate.getTime()) /
      (1000 * 60 * 60 * 24);
    // Keep if: has stars, or lasted more than 1 day, or is ongoing
    return repo.stars > 0 || durationDays > 1 || repo.isOngoing;
  });

  // Sort by stars (descending), then by start date
  processed.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return a.startDate.getTime() - b.startDate.getTime();
  });

  // Limit to maxRepos
  return processed.slice(0, maxRepos);
}
