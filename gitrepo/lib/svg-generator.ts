import { ProcessedRepo, Theme, Mode, ThemeColors } from "./types";
import { getLanguageColor, darkenColor } from "./colors";

// ─── Theme Definitions ──────────────────────────────────────────────────────

const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    background: "#0D1117",
    cardBackground: "#161B22",
    text: "#C9D1D9",
    textSecondary: "#8B949E",
    textMuted: "#484F58",
    border: "#30363D",
    gridLine: "#21262D",
    yearText: "#6E7681",
    barDefaultFill: "#58A6FF",
    barDefaultStroke: "#1F6FEB",
    titleText: "#58A6FF",
    ongoingBadge: "#238636",
    ongoingBadgeText: "#FFFFFF",
    starColor: "#E3B341",
    rowHover: "#1C2128",
    accentGlow: "rgba(56,139,253,0.15)",
  },
  light: {
    background: "#FFFFFF",
    cardBackground: "#F6F8FA",
    text: "#24292F",
    textSecondary: "#57606A",
    textMuted: "#8C959F",
    border: "#D0D7DE",
    gridLine: "#EAEEF2",
    yearText: "#8C959F",
    barDefaultFill: "#0969DA",
    barDefaultStroke: "#0550AE",
    titleText: "#0969DA",
    ongoingBadge: "#1A7F37",
    ongoingBadgeText: "#FFFFFF",
    starColor: "#9A6700",
    rowHover: "#F3F4F6",
    accentGlow: "rgba(9,105,218,0.08)",
  },
};

// ─── Layout Constants ────────────────────────────────────────────────────────

const PADDING_X = 28;
const PADDING_TOP = 24;
const HEADER_HEIGHT = 50;
const AXIS_HEIGHT = 28;
const ROW_HEIGHT_FULL = 42;
const ROW_HEIGHT_COMPACT = 30;
const ROW_GAP = 2;
const BAR_HEIGHT_FULL = 14;
const BAR_HEIGHT_COMPACT = 10;
const LABEL_WIDTH = 150;
const MIN_BAR_WIDTH = 6;
const FOOTER_HEIGHT = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

function getMonthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  );
}

function formatDuration(start: Date, end: Date, ongoing: boolean): string {
  const months = getMonthsBetween(start, end);
  if (months < 1) return ongoing ? "< 1mo" : "< 1mo";
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y`;
  return `${years}y ${rem}mo`;
}

function toX(date: Date, globalStart: Date, totalMonths: number, chartX: number, chartWidth: number): number {
  const m = getMonthsBetween(globalStart, date);
  return chartX + (m / totalMonths) * chartWidth;
}

// ─── Main SVG Generator ─────────────────────────────────────────────────────

export function generateTimelineSVG(
  repos: ProcessedRepo[],
  username: string,
  theme: Theme = "dark",
  mode: Mode = "full"
): string {
  const colors = THEMES[theme];
  const rowHeight = mode === "compact" ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_FULL;
  const barHeight = mode === "compact" ? BAR_HEIGHT_COMPACT : BAR_HEIGHT_FULL;

  if (repos.length === 0) {
    return generateEmptySVG(username, colors);
  }

  // Sort by start date for display
  const sortedRepos = [...repos].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // ── Global time range ──
  const globalStart = new Date(
    Math.min(...sortedRepos.map((r) => r.startDate.getTime()))
  );
  const globalEnd = new Date(
    Math.max(...sortedRepos.map((r) => r.endDate.getTime()))
  );

  // Padding
  globalStart.setMonth(globalStart.getMonth() - 1);
  globalStart.setDate(1);
  globalEnd.setMonth(globalEnd.getMonth() + 2);
  globalEnd.setDate(1);

  const totalMonths = Math.max(1, getMonthsBetween(globalStart, globalEnd));

  // ── Dimensions ──
  const chartWidth = Math.max(360, Math.min(720, totalMonths * 16));
  const totalWidth = PADDING_X * 2 + LABEL_WIDTH + chartWidth + 80; // extra for duration label
  const repoAreaHeight = sortedRepos.length * (rowHeight + ROW_GAP);
  const totalHeight = PADDING_TOP + HEADER_HEIGHT + AXIS_HEIGHT + repoAreaHeight + FOOTER_HEIGHT;

  const chartX = PADDING_X + LABEL_WIDTH;
  const chartY = PADDING_TOP + HEADER_HEIGHT + AXIS_HEIGHT;

  // ── Find longest project ──
  let longestIdx = 0;
  let longestDuration = 0;
  sortedRepos.forEach((repo, i) => {
    const dur = repo.endDate.getTime() - repo.startDate.getTime();
    if (dur > longestDuration) {
      longestDuration = dur;
      longestIdx = i;
    }
  });

  const svg: string[] = [];

  // ── SVG root ──
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );

  // ── Defs ──
  svg.push(`<defs>`);

  // Clip path for chart area
  svg.push(`<clipPath id="chart-clip"><rect x="${chartX}" y="${chartY - 2}" width="${chartWidth}" height="${repoAreaHeight + 4}"/></clipPath>`);

  // Gradients per repo
  sortedRepos.forEach((repo, i) => {
    const base = getLanguageColor(repo.primaryLanguage);
    const dark = darkenColor(base, 0.15);
    svg.push(`<linearGradient id="g${i}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${base}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>`);
  });

  // Styles
  svg.push(`<style>
    .f { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .row { animation: fadeIn 0.4s ease forwards; }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .live { animation: blink 2s ease-in-out infinite; }
  </style>`);

  svg.push(`</defs>`);

  // ── Background ──
  svg.push(`<rect width="${totalWidth}" height="${totalHeight}" rx="6" fill="${colors.background}"/>`);
  svg.push(`<rect x="0.5" y="0.5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="6" fill="none" stroke="${colors.border}" stroke-width="1"/>`);

  // ── Header ──
  const hY = PADDING_TOP + 16;
  // Small GitHub octicon
  svg.push(`<g transform="translate(${PADDING_X},${hY - 10}) scale(0.7)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="${colors.textSecondary}"/></g>`);

  svg.push(`<text x="${PADDING_X + 22}" y="${hY}" class="f" font-size="14" font-weight="600" fill="${colors.text}">${escapeXml(username)}</text>`);
  svg.push(`<text x="${PADDING_X + 22}" y="${hY + 16}" class="f" font-size="10" fill="${colors.textMuted}">Project Timeline</text>`);

  // Right-side badge: project count
  const badgeLabel = `${sortedRepos.length} project${sortedRepos.length === 1 ? "" : "s"}`;
  const bW = badgeLabel.length * 6.5 + 14;
  const bX = totalWidth - PADDING_X - bW;
  svg.push(`<rect x="${bX}" y="${hY - 10}" width="${bW}" height="18" rx="9" fill="${colors.cardBackground}" stroke="${colors.border}" stroke-width="0.5"/>`);
  svg.push(`<text x="${bX + bW / 2}" y="${hY + 2}" class="f" font-size="10" fill="${colors.textSecondary}" text-anchor="middle">${badgeLabel}</text>`);

  // ── Year axis ──
  const axisY = PADDING_TOP + HEADER_HEIGHT;
  const startYear = globalStart.getFullYear();
  const endYear = globalEnd.getFullYear();

  // Thin axis baseline
  svg.push(`<line x1="${chartX}" y1="${axisY + AXIS_HEIGHT - 1}" x2="${chartX + chartWidth}" y2="${axisY + AXIS_HEIGHT - 1}" stroke="${colors.border}" stroke-width="0.5"/>`);

  for (let year = startYear; year <= endYear; year++) {
    const x = toX(new Date(year, 0, 1), globalStart, totalMonths, chartX, chartWidth);
    if (x >= chartX && x <= chartX + chartWidth) {
      // Vertical grid line (subtle)
      svg.push(`<line x1="${x}" y1="${axisY + AXIS_HEIGHT}" x2="${x}" y2="${chartY + repoAreaHeight}" stroke="${colors.gridLine}" stroke-width="0.5"/>`);
      // Year label
      svg.push(`<text x="${x}" y="${axisY + 12}" class="f" font-size="10" fill="${colors.yearText}" text-anchor="middle">${year}</text>`);
      // Small tick
      svg.push(`<line x1="${x}" y1="${axisY + AXIS_HEIGHT - 4}" x2="${x}" y2="${axisY + AXIS_HEIGHT}" stroke="${colors.textMuted}" stroke-width="0.5"/>`);
    }

    // Half-year markers (Jul)
    const midX = toX(new Date(year, 6, 1), globalStart, totalMonths, chartX, chartWidth);
    if (midX > chartX && midX < chartX + chartWidth) {
      svg.push(`<line x1="${midX}" y1="${axisY + AXIS_HEIGHT}" x2="${midX}" y2="${chartY + repoAreaHeight}" stroke="${colors.gridLine}" stroke-width="0.3" stroke-dasharray="2,4"/>`);
    }
  }

  // ── Rows ──
  sortedRepos.forEach((repo, i) => {
    const rowY = chartY + i * (rowHeight + ROW_GAP);
    const isLongest = i === longestIdx && sortedRepos.length > 1;
    const langColor = getLanguageColor(repo.primaryLanguage);

    // Row background (alternating subtle stripes)
    if (i % 2 === 0) {
      svg.push(`<rect x="${PADDING_X + 1}" y="${rowY}" width="${totalWidth - PADDING_X * 2 - 2}" height="${rowHeight}" fill="${colors.cardBackground}" opacity="0.35" rx="3"/>`);
    }

    // ── Left label area ──
    const labelCenterY = rowY + rowHeight / 2;

    // Language color dot
    svg.push(`<circle cx="${PADDING_X + 8}" cy="${labelCenterY}" r="4" fill="${langColor}"/>`);

    // Repo name
    const nameMaxLen = mode === "compact" ? 16 : 18;
    const displayName = truncate(repo.name, nameMaxLen);
    const nameColor = isLongest ? colors.titleText : colors.text;
    svg.push(`<text x="${PADDING_X + 18}" y="${labelCenterY - (mode === "full" ? 3 : 0)}" class="f" font-size="${mode === "compact" ? 10 : 11}" font-weight="500" fill="${nameColor}" dominant-baseline="${mode === "compact" ? "central" : "auto"}">${escapeXml(displayName)}</text>`);

    // Tech label (full mode)
    if (mode === "full") {
      const langStr = repo.secondaryLanguage
        ? `${repo.primaryLanguage} · ${repo.secondaryLanguage}`
        : repo.primaryLanguage;
      svg.push(`<text x="${PADDING_X + 18}" y="${labelCenterY + 10}" class="f" font-size="9" fill="${colors.textMuted}">${escapeXml(truncate(langStr, 22))}</text>`);
    }

    // Stars (inline, after name in compact; below in full)
    if (repo.stars > 0 && mode === "full") {
      svg.push(`<text x="${LABEL_WIDTH - 4}" y="${labelCenterY - 3}" class="f" font-size="9" fill="${colors.starColor}" text-anchor="end">★${repo.stars}</text>`);
    }

    // ── Gantt segments (with gaps) ──
    const segments = repo.segments;
    segments.forEach((seg) => {
      let x1 = toX(seg.start, globalStart, totalMonths, chartX, chartWidth);
      let x2 = toX(seg.end, globalStart, totalMonths, chartX, chartWidth);

      // Clamp to chart
      x1 = Math.max(chartX, Math.min(x1, chartX + chartWidth));
      x2 = Math.max(chartX, Math.min(x2, chartX + chartWidth));

      let w = x2 - x1;
      if (w < MIN_BAR_WIDTH) w = MIN_BAR_WIDTH;
      if (x1 + w > chartX + chartWidth) w = chartX + chartWidth - x1;

      const barY = labelCenterY - barHeight / 2;

      // Bar
      svg.push(`<rect x="${x1}" y="${barY}" width="${w}" height="${barHeight}" rx="${barHeight / 2}" fill="url(#g${i})" opacity="0.9"/>`);
    });

    // ── Thin connector line between first and last segment (shows the full span) ──
    if (segments.length > 1) {
      const firstEnd = toX(segments[0].end, globalStart, totalMonths, chartX, chartWidth);
      const lastStart = toX(segments[segments.length - 1].start, globalStart, totalMonths, chartX, chartWidth);
      svg.push(`<line x1="${firstEnd}" y1="${labelCenterY}" x2="${lastStart}" y2="${labelCenterY}" stroke="${langColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.3"/>`);
    }

    // ── Duration + ongoing indicator ──
    const lastSegEnd = toX(repo.endDate, globalStart, totalMonths, chartX, chartWidth);
    const rightX = Math.min(lastSegEnd + 6, chartX + chartWidth + 6);
    const durStr = formatDuration(repo.startDate, repo.endDate, repo.isOngoing);

    svg.push(`<text x="${rightX}" y="${labelCenterY + 3}" class="f" font-size="9" fill="${colors.textMuted}">${durStr}</text>`);

    if (repo.isOngoing) {
      const dotX = rightX + durStr.length * 5.5 + 6;
      svg.push(`<circle cx="${dotX}" cy="${labelCenterY}" r="3" fill="${colors.ongoingBadge}" class="live"/>`);
    }

    // Longest badge
    if (isLongest) {
      svg.push(`<text x="${totalWidth - PADDING_X - 4}" y="${labelCenterY + 3}" class="f" font-size="9" fill="${colors.titleText}" text-anchor="end" opacity="0.7">longest</text>`);
    }
  });

  // ── Footer ──
  svg.push(`<text x="${totalWidth / 2}" y="${totalHeight - 10}" class="f" font-size="9" fill="${colors.textMuted}" text-anchor="middle" opacity="0.5">github-readme-timeline</text>`);

  svg.push(`</svg>`);
  return svg.join("\n");
}

// ─── Empty SVG ───────────────────────────────────────────────────────────────

function generateEmptySVG(username: string, colors: ThemeColors): string {
  const w = 420;
  const h = 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" rx="6" fill="${colors.background}" stroke="${colors.border}" stroke-width="1"/>
<text x="${w / 2}" y="38" class="f" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="13" fill="${colors.text}" text-anchor="middle" font-weight="600">No projects found for ${escapeXml(username)}</text>
<text x="${w / 2}" y="58" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${colors.textSecondary}" text-anchor="middle">Ensure the username is correct and has public repos.</text>
</svg>`;
}

// ─── Error SVG ───────────────────────────────────────────────────────────────

export function generateErrorSVG(message: string, theme: Theme = "dark"): string {
  const colors = THEMES[theme];
  const w = 420;
  const h = 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" rx="6" fill="${colors.background}" stroke="#DA3633" stroke-width="1"/>
<text x="${w / 2}" y="32" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12" fill="#DA3633" text-anchor="middle" font-weight="600">Error</text>
<text x="${w / 2}" y="52" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10" fill="${colors.textSecondary}" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
