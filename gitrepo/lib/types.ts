// ─── GitHub API Response Types ───────────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  languages_url: string;
  stargazers_count: number;
  description: string | null;
  html_url: string;
}

export interface GitHubLanguages {
  [language: string]: number;
}

// ─── Processed Data Types ────────────────────────────────────────────────────

/** A continuous period of activity within a repo */
export interface ActivitySegment {
  start: Date;
  end: Date;
}

export interface ProcessedRepo {
  name: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  primaryLanguage: string;
  secondaryLanguage: string | null;
  stars: number;
  description: string | null;
  url: string;
  /** Active segments (gaps > 90 days create separate segments) */
  segments: ActivitySegment[];
}

// ─── SVG Configuration ──────────────────────────────────────────────────────

export type Theme = "dark" | "light";
export type Mode = "compact" | "full";

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
}
