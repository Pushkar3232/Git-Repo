// ─── GitHub API Response Types ───────────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  size: number; // KB
  languages_url: string;
  stargazers_count: number;
  forks_count: number;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  description: string | null;
  html_url: string;
  license: { key: string } | null;
  open_issues_count: number;
}

export interface GitHubLanguages {
  [language: string]: number;
}

// ─── Processed Data Types ────────────────────────────────────────────────────

/** A continuous period of active development within a repo */
export interface ActiveBlock {
  start: Date;
  end: Date;
  /** Duration in days for this block */
  durationDays: number;
}

/** Complexity label derived from 0–100 score */
export type ComplexityLabel = "Low" | "Medium" | "High" | "Very High";

export interface ProcessedRepo {
  name: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  primaryLanguage: string;
  secondaryLanguage: string | null;
  stars: number;
  forks: number;
  description: string | null;
  url: string;

  /** Active development blocks (gaps > 30 days create separate blocks) */
  activeBlocks: ActiveBlock[];
  /** Sum of all active block durations in days */
  activeDays: number;

  /** Documentation & usability score (0–1) */
  documentationScore: number;
  /** Project completeness score (0–1) */
  completenessScore: number;
  /** Code quality heuristic score (0–1) */
  codeQualityScore: number;
  /** Commit quality score (0–1) */
  commitQualityScore: number;
  /** Maintenance & health score (0–1) */
  maintenanceScore: number;
  /** Stars bonus score (0–1, log-scaled) */
  starScore: number;
  /** Forks bonus score (0–1, log-scaled) */
  forkScore: number;
  /** Final ranking score (0–100) */
  finalScore: number;

  /** Total commit count */
  commitCount: number;

  /** Project complexity score (0–100) */
  complexityScore: number;
  /** Human-readable complexity label */
  complexityLabel: ComplexityLabel;

  // Legacy compat for full SVG view
  /** @deprecated use activeBlocks */
  segments: { start: Date; end: Date }[];
}

// ─── SVG Configuration ──────────────────────────────────────────────────────

export type Theme = "dark" | "light";
export type Mode = "mini" | "full";

export interface TimelineConfig {
  username: string;
  theme: Theme;
  mode: Mode;
  maxRepos: number;
}

export interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  gridLine: string;
  yearText: string;
  barDefaultFill: string;
  barDefaultStroke: string;
  titleText: string;
  ongoingBadge: string;
  ongoingBadgeText: string;
  starColor: string;
  rowHover: string;
  accentGlow: string;
  complexityHigh: string;
  complexityMedium: string;
  complexityLow: string;
}
