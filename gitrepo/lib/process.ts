import {
  GitHubRepo,
  GitHubLanguages,
  ProcessedRepo,
  ActiveBlock,
  ComplexityLabel,
} from "./types";
import {
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchRepoTagsCount,
  fetchRepoRootContents,
  fetchRepoReadmeContent,
} from "./github";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Gaps > 30 days between commits start a new active block */
const INACTIVITY_GAP_DAYS = 30;

/** Repo is considered "ongoing" if pushed within this many days */
const ONGOING_THRESHOLD_DAYS = 60;

/** Keywords that signal engineering complexity in commit messages */
const COMPLEXITY_KEYWORDS = [
  "refactor",
  "optimize",
  "restructure",
  "performance",
];

// ─── Fix 1: Hard Elimination Filter ─────────────────────────────────────────

/**
 * STRICT filter — exclude a repo if ANY condition is true:
 * - repo.name === username (profile README repo)
 * - repo.fork === true
 * - repo.archived === true
 * - repo.size < 100 KB
 */
export function hardFilterRepos(
  repos: GitHubRepo[],
  username: string
): GitHubRepo[] {
  const lowerUsername = username.toLowerCase();
  return repos.filter((repo) => {
    if (repo.name.toLowerCase() === lowerUsername) return false;
    if (repo.fork) return false;
    if (repo.archived) return false;
    if (repo.size < 100) return false; // size is in KB from GitHub API
    return true;
  });
}

// ─── Fix 2: Active Development Duration ─────────────────────────────────────

/**
 * Build active development blocks from commit dates.
 * Uses a 30-day inactivity gap to separate blocks.
 *
 * Returns { blocks, activeDays } where activeDays = sum(block durations).
 */
function buildActiveBlocks(commitDates: Date[]): {
  blocks: ActiveBlock[];
  activeDays: number;
} {
  if (commitDates.length === 0) {
    return { blocks: [], activeDays: 0 };
  }

  // Sort oldest → newest
  const sorted = [...commitDates].sort((a, b) => a.getTime() - b.getTime());

  const blocks: ActiveBlock[] = [];
  let blockStart = sorted[0];
  let blockEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const gapDays =
      (sorted[i].getTime() - blockEnd.getTime()) / (1000 * 60 * 60 * 24);

    if (gapDays > INACTIVITY_GAP_DAYS) {
      // Close current block, start new one
      const durationDays = Math.max(
        1,
        (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      blocks.push({ start: blockStart, end: blockEnd, durationDays });
      blockStart = sorted[i];
    }
    blockEnd = sorted[i];
  }

  // Close final block
  const durationDays = Math.max(
    1,
    (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  blocks.push({ start: blockStart, end: blockEnd, durationDays });

  const activeDays = blocks.reduce((sum, b) => sum + b.durationDays, 0);

  return { blocks, activeDays };
}

// ─── Quality Scoring Functions ──────────────────────────────────────────────

/**
 * 1️⃣ Documentation & Usability score (0–1). Weight: 25%
 */
function scoreDocumentation(params: {
  readmeExists: boolean;
  readmeLength: number;
  hasUsageSection: boolean;
  hasLicense: boolean;
}): number {
  const readmeExistsScore = params.readmeExists ? 1 : 0;

  let readmeLengthScore = 0;
  if (params.readmeLength >= 2000) readmeLengthScore = 1;
  else if (params.readmeLength >= 1000) readmeLengthScore = 0.8;
  else if (params.readmeLength >= 500) readmeLengthScore = 0.6;
  else if (params.readmeLength >= 200) readmeLengthScore = 0.3;

  const usageSectionScore = params.hasUsageSection ? 1 : 0;
  const licenseScore = params.hasLicense ? 1 : 0;

  return (
    readmeExistsScore * 0.4 +
    readmeLengthScore * 0.3 +
    usageSectionScore * 0.2 +
    licenseScore * 0.1
  );
}

/**
 * 2️⃣ Project Completeness score (0–1). Weight: 20%
 */
function scoreCompleteness(rootFiles: string[], rootDirs: string[]): number {
  const checks = [
    // Build/dependency config
    rootFiles.some((f) =>
      [
        "package.json", "pom.xml", "setup.py", "requirements.txt", "go.mod",
        "cargo.toml", "build.gradle", "gemfile", "pyproject.toml",
        "composer.json", "mix.exs", "build.sbt", "deno.json",
      ].includes(f)
    ),
    // Dockerfile or build/CI config
    rootFiles.some((f) =>
      [
        "dockerfile", "docker-compose.yml", "docker-compose.yaml", "makefile",
        "justfile", "cmakelists.txt", "jenkinsfile", ".gitlab-ci.yml",
        "vercel.json", "netlify.toml", "fly.toml", "render.yaml", "procfile",
      ].includes(f)
    ) || rootDirs.includes(".github") || rootDirs.includes(".circleci"),
    // .gitignore
    rootFiles.includes(".gitignore"),
    // Environment/config files
    rootFiles.some((f) => f.startsWith(".env") || f.includes("config")) ||
      rootDirs.some((d) =>
        ["config", "configuration", "settings"].includes(d)
      ),
  ];

  const foundCount = checks.filter(Boolean).length;
  return foundCount / checks.length;
}

/**
 * 3️⃣ Code Quality heuristic score (0–1). Weight: 20%
 */
function scoreCodeQuality(rootFiles: string[], rootDirs: string[]): number {
  // Clean folder structure
  const hasStructure = rootDirs.some((d) =>
    [
      "src", "lib", "app", "pkg", "internal", "cmd", "core",
      "modules", "packages", "components", "services",
    ].includes(d)
  );

  // Tests folder or test files
  const hasTests =
    rootDirs.some((d) =>
      ["tests", "test", "__tests__", "spec", "testing", "e2e", "cypress"].includes(d)
    ) || rootFiles.some((f) => f.includes(".test.") || f.includes(".spec."));

  // Lint/formatter config
  const hasLintConfig = rootFiles.some(
    (f) =>
      f.startsWith(".eslint") ||
      f.startsWith(".prettier") ||
      f.startsWith("eslint") ||
      f.startsWith("prettier") ||
      f === ".flake8" ||
      f === "tslint.json" ||
      f === ".editorconfig" ||
      f === "biome.json" ||
      f.startsWith(".stylelint") ||
      f === "rustfmt.toml" ||
      f === ".rubocop.yml" ||
      f === ".clang-format" ||
      f === "dprint.json"
  );

  return (
    (hasStructure ? 1 : 0) * 0.4 +
    (hasTests ? 1 : 0) * 0.3 +
    (hasLintConfig ? 1 : 0) * 0.3
  );
}

/**
 * 4️⃣ Commit Quality score (0–1). Weight: 10%
 * Evaluates message quality, time spread, and releases — NOT commit count.
 */
function scoreCommitQuality(params: {
  commits: { date: string; message: string }[];
  tagsCount: number;
}): number {
  const { commits, tagsCount } = params;
  if (commits.length === 0) return 0;

  // Meaningful commit messages
  let meaningfulCount = 0;
  for (const c of commits) {
    const firstLine = c.message.split("\n")[0].trim();
    if (firstLine.length < 3) continue;
    if (
      /^(\.+|x+|a+|test\d*|wip|tmp|asdf|qwer|aaa|bbb|zzz)$/i.test(firstLine)
    )
      continue;
    if (
      firstLine.length >= 10 ||
      firstLine.includes(":") ||
      firstLine.includes(" ")
    ) {
      meaningfulCount++;
    }
  }
  const meaningfulRatio = meaningfulCount / commits.length;

  // Time spread: commits across unique days
  const dates = commits
    .map((c) => new Date(c.date).getTime())
    .filter((d) => !isNaN(d));
  let timeSpreadScore = 0;
  if (dates.length >= 2) {
    const uniqueDays = new Set(
      dates.map((d) => Math.floor(d / (1000 * 60 * 60 * 24)))
    ).size;
    if (uniqueDays >= 30) timeSpreadScore = 1;
    else if (uniqueDays >= 14) timeSpreadScore = 0.8;
    else if (uniqueDays >= 7) timeSpreadScore = 0.6;
    else if (uniqueDays >= 3) timeSpreadScore = 0.4;
    else timeSpreadScore = 0.2;
  }

  // Releases/tags presence
  const releasesScore = tagsCount > 0 ? 1 : 0;

  return (
    meaningfulRatio * 0.5 + timeSpreadScore * 0.3 + releasesScore * 0.2
  );
}

/**
 * 5️⃣ Maintenance & Health score (0–1). Weight: 10%
 */
function scoreMaintenance(params: {
  pushedAt: string;
  hasIssues: boolean;
  openIssuesCount: number;
}): number {
  const lastPush = new Date(params.pushedAt);
  const daysSincePush =
    (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24);
  let recentActivityScore: number;
  if (daysSincePush < 30) recentActivityScore = 1;
  else if (daysSincePush < 90) recentActivityScore = 0.8;
  else if (daysSincePush < 180) recentActivityScore = 0.6;
  else if (daysSincePush < 365) recentActivityScore = 0.4;
  else recentActivityScore = 0.2;

  let issuesHealth = 0;
  if (params.hasIssues) {
    if (params.openIssuesCount <= 10) issuesHealth = 1.0;
    else if (params.openIssuesCount <= 50) issuesHealth = 0.6;
    else issuesHealth = 0.3;
  }

  return recentActivityScore * 0.6 + issuesHealth * 0.4;
}

/**
 * ⭐ 6️⃣ Star bonus score (0–1). Weight: 10%
 * Log-scaled so stars don't dominate. stars = 0 → score = 0.
 */
function scoreStars(stars: number, maxStars: number): number {
  if (maxStars === 0 || stars === 0) return 0;
  return Math.log(stars + 1) / Math.log(maxStars + 1);
}

/**
 * 🍴 7️⃣ Fork bonus score (0–1). Weight: 5%
 * Log-scaled. forks = 0 → score = 0.
 */
function scoreForks(forks: number, maxForks: number): number {
  if (maxForks === 0 || forks === 0) return 0;
  return Math.log(forks + 1) / Math.log(maxForks + 1);
}

// ─── Complexity Score ────────────────────────────────────────────────────────

function computeComplexityScore(params: {
  totalBytes: number;
  numLanguages: number;
  commitsPerActiveDay: number;
  hasComplexityKeywords: boolean;
  activeDays: number;
  activeBlockCount: number;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
}): { score: number; label: ComplexityLabel } {
  // 1) Codebase size score (0–30)
  //    0 bytes → 0, 1MB → ~15, 10MB+ → 30
  const sizeScore = Math.min(30, (Math.log10(params.totalBytes + 1) / 7) * 30);

  // 2) Tech breadth score (0–20)
  //    1 lang → 4, 5+ → 20
  const breadthScore = Math.min(20, params.numLanguages * 4);

  // 3) Commit structure score (0–20)
  //    Density + keyword bonus
  const densityPart = Math.min(10, params.commitsPerActiveDay * 5);
  const keywordPart = params.hasComplexityKeywords ? 10 : 0;
  const commitStructureScore = Math.min(20, densityPart + keywordPart);

  // 4) Longevity score (0–20)
  //    active_days / 365 * 20, capped at 20
  const longevityScore = Math.min(
    20,
    (params.activeDays / 365) * 15 + params.activeBlockCount * 1
  );

  // 5) Maturity score (0–10)
  let maturityScore = 0;
  if (params.hasIssues) maturityScore += 3.33;
  if (params.hasProjects) maturityScore += 3.33;
  if (params.hasWiki) maturityScore += 3.34;

  const raw =
    sizeScore + breadthScore + commitStructureScore + longevityScore + maturityScore;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  let label: ComplexityLabel;
  if (score >= 75) label = "Very High";
  else if (score >= 50) label = "High";
  else if (score >= 25) label = "Medium";
  else label = "Low";

  return { score, label };
}

// ─── Language Extraction ─────────────────────────────────────────────────────

function extractLanguages(languages: GitHubLanguages): {
  primary: string;
  secondary: string | null;
  totalBytes: number;
  numLanguages: number;
} {
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const totalBytes = sorted.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (sorted.length === 0) {
    return { primary: "Unknown", secondary: null, totalBytes: 0, numLanguages: 0 };
  }
  return {
    primary: sorted[0][0],
    secondary: sorted.length > 1 ? sorted[1][0] : null,
    totalBytes,
    numLanguages: sorted.length,
  };
}

// ─── Ongoing Detection ──────────────────────────────────────────────────────

function isProjectOngoing(pushedAt: string): boolean {
  const lastPush = new Date(pushedAt);
  const diffDays = (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= ONGOING_THRESHOLD_DAYS;
}

// ─── Diversity Filter ────────────────────────────────────────────────────────

/**
 * From a sorted list, pick top N with max 2 per primary language.
 */
function applyDiversityFilter(
  repos: ProcessedRepo[],
  maxPerLang: number,
  finalCount: number
): ProcessedRepo[] {
  const langCounts: Record<string, number> = {};
  const result: ProcessedRepo[] = [];

  for (const repo of repos) {
    const lang = repo.primaryLanguage;
    const count = langCounts[lang] ?? 0;
    if (count >= maxPerLang) continue;
    langCounts[lang] = count + 1;
    result.push(repo);
    if (result.length >= finalCount) break;
  }

  return result;
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Quality-first processing pipeline:
 * 1. Hard elimination (name, fork, archived, size)
 * 2. Enrich with commits, languages, readme content, tags, root contents
 * 3. Score 7 quality categories per repo
 * 4. Weighted final score (0–100)
 * 5. Diversity filter → return top N
 */
export async function processRepos(
  repos: GitHubRepo[],
  username: string,
  maxRepos: number = 5
): Promise<ProcessedRepo[]> {
  // ── Stage 1: Hard elimination ──
  const filtered = hardFilterRepos(repos, username);

  if (filtered.length === 0) return [];

  // ── Enrich: fetch commits, languages, readme content, tags, root contents ──
  const enrichPromises = filtered.map(async (repo) => {
    const [commits, languages, readmeInfo, tagsCount, rootContents] =
      await Promise.all([
        fetchRepoCommits(username, repo.name).catch(
          () => [] as { date: string; message: string }[]
        ),
        fetchRepoLanguages(username, repo.name).catch(
          () => ({}) as GitHubLanguages
        ),
        fetchRepoReadmeContent(username, repo.name).catch(() => ({
          exists: false,
          length: 0,
          hasUsageSection: false,
        })),
        fetchRepoTagsCount(username, repo.name).catch(() => 0),
        fetchRepoRootContents(username, repo.name).catch(
          () => [] as { name: string; type: string }[]
        ),
      ]);
    return { commits, languages, readmeInfo, tagsCount, rootContents };
  });

  const enriched = await Promise.all(enrichPromises);

  // Combine repos with enrichment data (no commit-count filter)
  const withEnrichment = filtered.map((repo, i) => ({
    repo,
    data: enriched[i],
  }));

  if (withEnrichment.length === 0) return [];

  // Compute max stars and forks across all candidates for log scaling
  const maxStars = Math.max(
    ...withEnrichment.map(({ repo }) => repo.stargazers_count),
    1
  );
  const maxForks = Math.max(
    ...withEnrichment.map(({ repo }) => repo.forks_count),
    1
  );

  // ── Build ProcessedRepo for each surviving repo ──
  const processed: ProcessedRepo[] = withEnrichment.map(({ repo, data }) => {
    const { commits, languages, readmeInfo, tagsCount, rootContents } = data;

    // Languages
    const { primary, secondary, totalBytes, numLanguages } =
      extractLanguages(languages);

    // Parse commit dates
    const commitDates = commits
      .map((c) => new Date(c.date))
      .filter((d) => !isNaN(d.getTime()));

    // Active development blocks
    const { blocks, activeDays } = buildActiveBlocks(commitDates);
    const commitCount = commits.length;

    // Determine ongoing status from pushed_at
    const ongoing = isProjectOngoing(repo.pushed_at);

    // Earliest and latest commit, or fall back to repo dates
    const startDate =
      blocks.length > 0 ? blocks[0].start : new Date(repo.created_at);
    const endDate = ongoing
      ? new Date()
      : blocks.length > 0
        ? blocks[blocks.length - 1].end
        : new Date(repo.pushed_at);

    // ── Classify root contents for quality checks ──
    const rootFiles = rootContents
      .filter((i) => i.type === "file")
      .map((i) => i.name.toLowerCase());
    const rootDirs = rootContents
      .filter((i) => i.type === "dir")
      .map((i) => i.name.toLowerCase());

    // ── Score each quality category (0–1) ──

    // 1. Documentation & Usability (25%)
    const documentationScore = scoreDocumentation({
      readmeExists: readmeInfo.exists,
      readmeLength: readmeInfo.length,
      hasUsageSection: readmeInfo.hasUsageSection,
      hasLicense: repo.license !== null,
    });

    // 2. Project Completeness (20%)
    const completenessScore = scoreCompleteness(rootFiles, rootDirs);

    // 3. Code Quality (20%)
    const codeQualityScore = scoreCodeQuality(rootFiles, rootDirs);

    // 4. Commit Quality (10%)
    const commitQualityScore = scoreCommitQuality({ commits, tagsCount });

    // 5. Maintenance & Health (10%)
    const maintenanceScore = scoreMaintenance({
      pushedAt: repo.pushed_at,
      hasIssues: repo.has_issues,
      openIssuesCount: repo.open_issues_count ?? 0,
    });

    // 6. Stars bonus (10%)
    const starScoreVal = scoreStars(repo.stargazers_count, maxStars);

    // 7. Forks bonus (5%)
    const forkScoreVal = scoreForks(repo.forks_count, maxForks);

    // ── Final score (0–100) ──
    const finalScore =
      (0.25 * documentationScore +
        0.20 * completenessScore +
        0.20 * codeQualityScore +
        0.10 * commitQualityScore +
        0.10 * maintenanceScore +
        0.10 * starScoreVal +
        0.05 * forkScoreVal) *
      100;

    // ── Complexity score (display feature, unchanged) ──
    const safeActiveDays = Math.max(1, activeDays);
    const density = commitCount / safeActiveDays;
    const hasComplexityKeywords = commits.some((c) =>
      COMPLEXITY_KEYWORDS.some((kw) => c.message.toLowerCase().includes(kw))
    );

    const { score: complexityScore, label: complexityLabel } =
      computeComplexityScore({
        totalBytes,
        numLanguages,
        commitsPerActiveDay: density,
        hasComplexityKeywords,
        activeDays,
        activeBlockCount: blocks.length,
        hasIssues: repo.has_issues,
        hasProjects: repo.has_projects,
        hasWiki: repo.has_wiki,
      });

    return {
      name: repo.name,
      startDate,
      endDate,
      isOngoing: ongoing,
      primaryLanguage: primary,
      secondaryLanguage: secondary,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      description: repo.description,
      url: repo.html_url,
      activeBlocks: blocks,
      activeDays,
      commitCount,
      documentationScore,
      completenessScore,
      codeQualityScore,
      commitQualityScore,
      maintenanceScore,
      starScore: starScoreVal,
      forkScore: forkScoreVal,
      finalScore: Math.round(finalScore * 100) / 100,
      complexityScore,
      complexityLabel,
      // Legacy compat
      segments: blocks.map((b) => ({ start: b.start, end: b.end })),
    };
  });

  // ── Stage 3: Sort by finalScore DESC ──
  processed.sort((a, b) => b.finalScore - a.finalScore);

  // Take top 8 candidates
  const top8 = processed.slice(0, 8);

  // Apply diversity: max 2 per primary language, return top maxRepos
  const finalSelection = applyDiversityFilter(top8, 2, maxRepos);

  return finalSelection;
}
