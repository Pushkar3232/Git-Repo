import { ProcessedRepo, Theme, Mode, ThemeColors } from "./types";
import { getLanguageColor, darkenColor, lightenColor } from "./colors";

// ─── Theme Definitions ──────────────────────────────────────────────────────

const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    background: "#0D1117",
    cardBackground: "#161B22",
    text: "#E6EDF3",
    textSecondary: "#8B949E",
    border: "#30363D",
    gridLine: "#21262D",
    yearText: "#8B949E",
    barDefaultFill: "#58A6FF",
    barDefaultStroke: "#1F6FEB",
    titleText: "#58A6FF",
    ongoingBadge: "#238636",
    ongoingBadgeText: "#FFFFFF",
    starColor: "#E3B341",
  },
  light: {
    background: "#FFFFFF",
    cardBackground: "#F6F8FA",
    text: "#1F2328",
    textSecondary: "#656D76",
    border: "#D0D7DE",
    gridLine: "#EAEEF2",
    yearText: "#656D76",
    barDefaultFill: "#0969DA",
    barDefaultStroke: "#0550AE",
    titleText: "#0969DA",
    ongoingBadge: "#1A7F37",
    ongoingBadgeText: "#FFFFFF",
    starColor: "#B08800",
  },
};

// ─── Layout Constants ────────────────────────────────────────────────────────

const PADDING_X = 24;
const PADDING_Y = 20;
const HEADER_HEIGHT = 60;
const YEAR_AXIS_HEIGHT = 30;
const ROW_HEIGHT_FULL = 64;
const ROW_HEIGHT_COMPACT = 48;
const ROW_GAP = 4;
const BAR_HEIGHT_FULL = 22;
const BAR_HEIGHT_COMPACT = 16;
const LABEL_WIDTH = 160;
const MIN_BAR_WIDTH = 12;
const FOOTER_HEIGHT = 36;
const CARD_RADIUS = 10;

// ─── Escape XML ──────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Truncate text ───────────────────────────────────────────────────────────

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

// ─── Month/Year helpers ──────────────────────────────────────────────────────

function getMonthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  );
}

function formatDate(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
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

  // Sort repos by start date for display
  const sortedRepos = [...repos].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // ── Compute global time range ──
  const globalStart = new Date(
    Math.min(...sortedRepos.map((r) => r.startDate.getTime()))
  );
  const globalEnd = new Date(
    Math.max(...sortedRepos.map((r) => r.endDate.getTime()))
  );

  // Add padding months
  globalStart.setMonth(globalStart.getMonth() - 1);
  globalStart.setDate(1);
  globalEnd.setMonth(globalEnd.getMonth() + 2);
  globalEnd.setDate(1);

  const totalMonths = getMonthsBetween(globalStart, globalEnd);

  // ── SVG dimensions ──
  const chartWidth = Math.max(400, Math.min(800, totalMonths * 20));
  const totalWidth = PADDING_X * 2 + LABEL_WIDTH + chartWidth;
  const totalHeight =
    PADDING_Y * 2 +
    HEADER_HEIGHT +
    YEAR_AXIS_HEIGHT +
    sortedRepos.length * (rowHeight + ROW_GAP) +
    FOOTER_HEIGHT;

  const chartX = PADDING_X + LABEL_WIDTH;
  const chartY = PADDING_Y + HEADER_HEIGHT + YEAR_AXIS_HEIGHT;

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

  // ── Build SVG ──
  const parts: string[] = [];

  // Open SVG tag
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" fill="none">`
  );

  // Defs: gradients, filters
  parts.push(`<defs>`);

  // Card shadow filter
  parts.push(`
    <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.1" flood-color="#000"/>
    </filter>
  `);

  // Gradient per repo based on language color
  sortedRepos.forEach((repo, i) => {
    const baseColor = getLanguageColor(repo.primaryLanguage);
    const lightColor = lightenColor(baseColor, 0.2);
    parts.push(`
      <linearGradient id="bar-grad-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${baseColor}"/>
        <stop offset="100%" stop-color="${lightColor}"/>
      </linearGradient>
    `);
  });

  // Ongoing pulse animation
  parts.push(`
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .ongoing-dot { animation: pulse 2s ease-in-out infinite; }
      .repo-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    </style>
  `);

  parts.push(`</defs>`);

  // ── Background card ──
  parts.push(
    `<rect width="${totalWidth}" height="${totalHeight}" rx="${CARD_RADIUS}" fill="${colors.background}" stroke="${colors.border}" stroke-width="1"/>`
  );

  // ── Header ──
  const headerY = PADDING_Y + 20;

  // GitHub icon
  parts.push(`
    <g transform="translate(${PADDING_X}, ${headerY - 12})">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="${colors.textSecondary}" transform="scale(0.9)"/>
    </g>
  `);

  parts.push(
    `<text x="${PADDING_X + 28}" y="${headerY}" class="repo-label" font-size="16" font-weight="700" fill="${colors.text}">${escapeXml(username)}</text>`
  );
  parts.push(
    `<text x="${PADDING_X + 28}" y="${headerY + 18}" class="repo-label" font-size="11" fill="${colors.textSecondary}">Project Timeline</text>`
  );

  // Repo count badge
  const badgeText = `${sortedRepos.length} projects`;
  const badgeWidth = badgeText.length * 7 + 16;
  parts.push(`
    <rect x="${totalWidth - PADDING_X - badgeWidth}" y="${headerY - 12}" width="${badgeWidth}" height="22" rx="11" fill="${colors.cardBackground}" stroke="${colors.border}" stroke-width="1"/>
    <text x="${totalWidth - PADDING_X - badgeWidth / 2}" y="${headerY + 2}" class="repo-label" font-size="11" fill="${colors.textSecondary}" text-anchor="middle">${badgeText}</text>
  `);

  // ── Year axis ──
  const axisY = PADDING_Y + HEADER_HEIGHT;
  const startYear = globalStart.getFullYear();
  const endYear = globalEnd.getFullYear();

  // Grid lines and year labels
  for (let year = startYear; year <= endYear; year++) {
    const yearDate = new Date(year, 0, 1);
    const monthsFromStart = getMonthsBetween(globalStart, yearDate);
    const x = chartX + (monthsFromStart / totalMonths) * chartWidth;

    if (x >= chartX && x <= chartX + chartWidth) {
      // Vertical grid line
      parts.push(
        `<line x1="${x}" y1="${axisY + 18}" x2="${x}" y2="${chartY + sortedRepos.length * (rowHeight + ROW_GAP)}" stroke="${colors.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`
      );

      // Year label
      parts.push(
        `<text x="${x}" y="${axisY + 14}" class="repo-label" font-size="11" fill="${colors.yearText}" text-anchor="middle">${year}</text>`
      );
    }
  }

  // Axis line
  parts.push(
    `<line x1="${chartX}" y1="${axisY + 20}" x2="${chartX + chartWidth}" y2="${axisY + 20}" stroke="${colors.border}" stroke-width="1"/>`
  );

  // ── Rows ──
  sortedRepos.forEach((repo, i) => {
    const rowY = chartY + i * (rowHeight + ROW_GAP);
    const isLongest = i === longestIdx;

    // Alternating row background
    if (i % 2 === 0) {
      parts.push(
        `<rect x="${PADDING_X}" y="${rowY}" width="${totalWidth - PADDING_X * 2}" height="${rowHeight}" rx="4" fill="${colors.cardBackground}" opacity="0.5"/>`
      );
    }

    // ── Repo name ──
    const labelY = rowY + (mode === "compact" ? rowHeight / 2 + 4 : 18);
    const displayName = truncate(repo.name, 18);

    parts.push(
      `<text x="${PADDING_X + 8}" y="${labelY}" class="repo-label" font-size="${mode === "compact" ? 11 : 12}" font-weight="600" fill="${isLongest ? colors.titleText : colors.text}">${escapeXml(displayName)}</text>`
    );

    // ── Tech stack label (full mode only) ──
    if (mode === "full") {
      const langLabel = repo.secondaryLanguage
        ? `${repo.primaryLanguage} · ${repo.secondaryLanguage}`
        : repo.primaryLanguage;

      parts.push(
        `<text x="${PADDING_X + 8}" y="${rowY + 33}" class="repo-label" font-size="10" fill="${colors.textSecondary}">${escapeXml(langLabel)}</text>`
      );

      // Star count
      if (repo.stars > 0) {
        parts.push(`
          <text x="${PADDING_X + 8}" y="${rowY + 48}" class="repo-label" font-size="10" fill="${colors.starColor}">★ ${repo.stars}</text>
        `);
      }
    }

    // ── Gantt bar ──
    const startMonths = getMonthsBetween(globalStart, repo.startDate);
    const endMonths = getMonthsBetween(globalStart, repo.endDate);

    let barX = chartX + (startMonths / totalMonths) * chartWidth;
    let barW = ((endMonths - startMonths) / totalMonths) * chartWidth;

    // Ensure minimum bar width
    if (barW < MIN_BAR_WIDTH) {
      barW = MIN_BAR_WIDTH;
    }

    // Clamp to chart bounds
    if (barX < chartX) barX = chartX;
    if (barX + barW > chartX + chartWidth) barW = chartX + chartWidth - barX;

    const barY = rowY + (mode === "compact" ? (rowHeight - barHeight) / 2 : 8);
    const langColor = getLanguageColor(repo.primaryLanguage);
    const strokeColor = darkenColor(langColor, 0.3);

    // Bar shadow
    parts.push(
      `<rect x="${barX}" y="${barY + 1}" width="${barW}" height="${barHeight}" rx="${barHeight / 2}" fill="black" opacity="0.08"/>`
    );

    // Gantt bar
    parts.push(
      `<rect x="${barX}" y="${barY}" width="${barW}" height="${barHeight}" rx="${barHeight / 2}" fill="url(#bar-grad-${i})" stroke="${strokeColor}" stroke-width="0.5"/>`
    );

    // Language color dot before bar
    parts.push(
      `<circle cx="${barX - 6}" cy="${barY + barHeight / 2}" r="3" fill="${langColor}"/>`
    );

    // ── Duration label on bar (if wide enough) ──
    if (barW > 60) {
      const startStr = formatDate(repo.startDate);
      const endStr = repo.isOngoing ? "Present" : formatDate(repo.endDate);
      const durationStr = `${startStr} — ${endStr}`;

      parts.push(
        `<text x="${barX + barW / 2}" y="${barY + barHeight / 2 + 4}" class="repo-label" font-size="9" fill="#FFFFFF" text-anchor="middle" font-weight="500">${escapeXml(durationStr)}</text>`
      );
    }

    // ── Ongoing indicator ──
    if (repo.isOngoing) {
      const dotX = barX + barW + 8;
      const dotY = barY + barHeight / 2;

      parts.push(`
        <circle cx="${dotX}" cy="${dotY}" r="4" fill="${colors.ongoingBadge}" class="ongoing-dot"/>
        <text x="${dotX + 8}" y="${dotY + 3}" class="repo-label" font-size="9" fill="${colors.ongoingBadge}" font-weight="600">active</text>
      `);
    }

    // ── Longest project highlight ──
    if (isLongest && sortedRepos.length > 1) {
      parts.push(`
        <rect x="${barX + barW + (repo.isOngoing ? 50 : 8)}" y="${barY}" width="14" height="${barHeight}" rx="3" fill="${colors.titleText}" opacity="0.15"/>
        <text x="${barX + barW + (repo.isOngoing ? 57 : 15)}" y="${barY + barHeight / 2 + 3}" class="repo-label" font-size="8" fill="${colors.titleText}">👑</text>
      `);
    }
  });

  // ── Footer ──
  const footerY = totalHeight - PADDING_Y - 8;
  parts.push(
    `<text x="${totalWidth / 2}" y="${footerY}" class="repo-label" font-size="10" fill="${colors.textSecondary}" text-anchor="middle" opacity="0.7">Generated by GitHub Readme Timeline · ${new Date().getFullYear()}</text>`
  );

  // Close SVG
  parts.push(`</svg>`);

  return parts.join("\n");
}

// ─── Empty state SVG ─────────────────────────────────────────────────────────

function generateEmptySVG(username: string, colors: ThemeColors): string {
  const width = 480;
  const height = 120;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" rx="10" fill="${colors.background}" stroke="${colors.border}" stroke-width="1"/>
  <text x="${width / 2}" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" fill="${colors.text}" text-anchor="middle" font-weight="600">No projects found for ${escapeXml(username)}</text>
  <text x="${width / 2}" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="${colors.textSecondary}" text-anchor="middle">Make sure the username is correct and has public repos.</text>
</svg>`;
}

// ─── Error SVG ───────────────────────────────────────────────────────────────

export function generateErrorSVG(message: string, theme: Theme = "dark"): string {
  const colors = THEMES[theme];
  const width = 480;
  const height = 100;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" rx="10" fill="${colors.background}" stroke="#DA3633" stroke-width="1"/>
  <text x="${width / 2}" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13" fill="#DA3633" text-anchor="middle" font-weight="600">⚠ Error</text>
  <text x="${width / 2}" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="11" fill="${colors.textSecondary}" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
