import { ProcessedRepo, Theme, Mode, ThemeColors, ComplexityLabel } from "./types";
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
    complexityHigh: "#F85149",
    complexityMedium: "#D29922",
    complexityLow: "#3FB950",
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
    complexityHigh: "#CF222E",
    complexityMedium: "#BF8700",
    complexityLow: "#1A7F37",
  },
};

// ─── Language Abbreviations ──────────────────────────────────────────────────

const LANG_ABBR: Record<string, string> = {
  TypeScript: "TS",
  JavaScript: "JS",
  Python: "Py",
  Java: "Java",
  "C#": "C#",
  "C++": "C++",
  C: "C",
  Go: "Go",
  Rust: "Rust",
  Ruby: "Rb",
  PHP: "PHP",
  Kotlin: "Kt",
  Swift: "Swift",
  Dart: "Dart",
  Shell: "Sh",
  HTML: "HTML",
  CSS: "CSS",
  SCSS: "SCSS",
  Vue: "Vue",
  Svelte: "Svelte",
  R: "R",
  Julia: "Jl",
  Scala: "Scala",
  Elixir: "Ex",
  Haskell: "Hs",
  Lua: "Lua",
  Perl: "Pl",
  PowerShell: "PS",
  Dockerfile: "Docker",
  Makefile: "Make",
  "Jupyter Notebook": "Jupyter",
  Unknown: "—",
};

function langAbbr(lang: string): string {
  return LANG_ABBR[lang] ?? lang.slice(0, 4);
}

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
  return str.slice(0, maxLen - 1) + "\u2026";
}

function getMonthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  );
}

function formatDuration(start: Date, end: Date): string {
  const months = Math.max(1, getMonthsBetween(start, end));
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} yr`;
  return `${years}y ${rem}m`;
}

/**
 * Format active days into a human-readable string.
 */
function formatActiveDays(days: number): string {
  if (days < 30) return `${Math.round(days)} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} yr`;
  return `${years}y ${rem}m`;
}

/**
 * Get the color for a complexity label.
 */
function getComplexityColor(
  label: ComplexityLabel,
  colors: ThemeColors
): string {
  switch (label) {
    case "Very High":
    case "High":
      return colors.complexityHigh;
    case "Medium":
      return colors.complexityMedium;
    case "Low":
      return colors.complexityLow;
  }
}

/**
 * Get the triangle symbol for a complexity label.
 */
function getComplexitySymbol(label: ComplexityLabel): string {
  switch (label) {
    case "Very High":
      return "\u25B2\u25B2"; // ▲▲
    case "High":
      return "\u25B2"; // ▲
    case "Medium":
      return "\u25C6"; // ◆
    case "Low":
      return "\u25BD"; // ▽
  }
}

function toX(
  date: Date,
  globalStart: Date,
  totalMonths: number,
  chartX: number,
  chartWidth: number
): number {
  const m = getMonthsBetween(globalStart, date);
  return chartX + (m / totalMonths) * chartWidth;
}

// ─── Mini Card Generator (Default — compact for GitHub profiles) ─────────────

function generateMiniSVG(
  repos: ProcessedRepo[],
  username: string,
  theme: Theme
): string {
  const colors = THEMES[theme];

  if (repos.length === 0) {
    return generateEmptySVG(username, colors);
  }

  const sorted = repos;
  const maxActiveDays = Math.max(...sorted.map((r) => r.activeDays), 1);

  // Accent: teal/cyan matching streak-stats aesthetic
  const accent = theme === "dark" ? "#38D9A9" : "#0CA678";
  const accentFaded = theme === "dark" ? "rgba(56,217,169,0.15)" : "rgba(12,166,120,0.10)";
  const labelColor = colors.textSecondary;
  const valueColor = theme === "dark" ? "#E6EDF3" : "#1F2328";

  // ── Layout ──
  const cardW = 495;
  const padX = 25;
  const padY = 20;
  const headerH = 42;
  const rowH = 64;
  const rowSep = 1;
  const footerH = 32;

  const contentH = sorted.length * rowH + (sorted.length - 1) * rowSep;
  const cardH = padY + headerH + contentH + footerH + padY;

  const svg: string[] = [];
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">`
  );

  svg.push(`<defs>`);
  svg.push(`<style>`);
  svg.push(
    `.f{font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif}`
  );
  svg.push(
    `@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`
  );
  svg.push(`.row{animation:fadeIn .5s ease forwards;opacity:0}`);
  sorted.forEach((_, i) => {
    svg.push(`.d${i}{animation-delay:${150 + i * 120}ms}`);
  });
  svg.push(`</style>`);
  svg.push(`</defs>`);

  // ── Card background ──
  svg.push(
    `<rect width="${cardW}" height="${cardH}" rx="6" fill="${colors.background}"/>`
  );
  svg.push(
    `<rect x=".5" y=".5" width="${cardW - 1}" height="${cardH - 1}" rx="6" fill="none" stroke="${colors.border}" stroke-width="1"/>`
  );

  // ── Header ──
  const hY = padY + 16;
  svg.push(
    `<text x="${padX}" y="${hY}" class="f" font-size="13" fill="${valueColor}" font-weight="600">${escapeXml(username)}</text>`
  );
  svg.push(
    `<text x="${cardW - padX}" y="${hY}" class="f" font-size="10" fill="${colors.textMuted}" text-anchor="end">Key Projects</text>`
  );

  // Header divider
  const headerDivY = padY + headerH - 6;
  svg.push(
    `<line x1="${padX}" y1="${headerDivY}" x2="${cardW - padX}" y2="${headerDivY}" stroke="${colors.border}" stroke-width="1" opacity="0.4"/>`
  );

  // ── Column layout ──
  // | Name (left) | Bar (center) | Time (right-center) | Stack (right) |
  const nameX = padX;
  const barX = 170;
  const barMaxW = 160;
  const timeX = barX + barMaxW + 14;
  const stackX = cardW - padX;

  // ── Rows ──
  const contentStartY = padY + headerH;

  sorted.forEach((repo, i) => {
    const rowY = contentStartY + i * (rowH + rowSep);
    const centerY = rowY + rowH / 2;

    svg.push(`<g class="row d${i}">`);

    // Alternating row background for depth
    if (i % 2 === 1) {
      svg.push(
        `<rect x="1" y="${rowY}" width="${cardW - 2}" height="${rowH}" fill="${colors.cardBackground}" opacity="0.3"/>`
      );
    }

    // ── Project name (prominent) ──
    const nameStr = truncate(repo.name, 20);
    svg.push(
      `<text x="${nameX}" y="${centerY - 6}" class="f" font-size="13" fill="${valueColor}" font-weight="600">${escapeXml(nameStr)}</text>`
    );

    // ── Tech stack (below name, small muted) ──
    const langs = repo.secondaryLanguage
      ? `${langAbbr(repo.primaryLanguage)} \u00B7 ${langAbbr(repo.secondaryLanguage)}`
      : langAbbr(repo.primaryLanguage);

    let metaLine = langs;
    if (repo.complexityLabel === "High" || repo.complexityLabel === "Very High") {
      metaLine += `  \u00B7  Complexity: ${repo.complexityLabel}`;
    }
    svg.push(
      `<text x="${nameX}" y="${centerY + 12}" class="f" font-size="10" fill="${colors.textMuted}">${escapeXml(metaLine)}</text>`
    );

    // ── Activity bar ──
    const barY = centerY - 3;
    const barH = 6;

    // Track
    svg.push(
      `<rect x="${barX}" y="${barY}" width="${barMaxW}" height="${barH}" rx="3" fill="${accentFaded}"/>`
    );

    // Fill — proportional
    const ratio = repo.activeDays / maxActiveDays;
    const barW = Math.max(6, Math.round(barMaxW * ratio));
    svg.push(
      `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="3" fill="${accent}"/>`
    );

    // ── Active time (right of bar — prominent number) ──
    const activeStr = formatActiveDays(repo.activeDays);
    svg.push(
      `<text x="${timeX}" y="${centerY + 4}" class="f" font-size="12" fill="${accent}" font-weight="600">${activeStr}</text>`
    );

    svg.push(`</g>`);

    // Row divider
    if (i < sorted.length - 1) {
      const divY = rowY + rowH;
      svg.push(
        `<line x1="${padX}" y1="${divY}" x2="${cardW - padX}" y2="${divY}" stroke="${colors.border}" stroke-width="0.5" opacity="0.2"/>`
      );
    }
  });

  // ── Footer ──
  const footerY = contentStartY + contentH + footerH / 2 + 6;

  // Footer divider
  svg.push(
    `<line x1="${padX}" y1="${contentStartY + contentH + 8}" x2="${cardW - padX}" y2="${contentStartY + contentH + 8}" stroke="${colors.border}" stroke-width="1" opacity="0.4"/>`
  );

  // Total active time (sum across all projects)
  const totalDays = sorted.reduce((s, r) => s + r.activeDays, 0);
  const totalStr = formatActiveDays(totalDays);
  svg.push(
    `<text x="${padX}" y="${footerY + 4}" class="f" font-size="10" fill="${colors.textMuted}">Total Active</text>`
  );
  svg.push(
    `<text x="${padX + 76}" y="${footerY + 4}" class="f" font-size="11" fill="${accent}" font-weight="600">${totalStr}</text>`
  );

  // Project count
  svg.push(
    `<text x="${cardW - padX}" y="${footerY + 4}" class="f" font-size="10" fill="${colors.textMuted}" text-anchor="end">${sorted.length} projects</text>`
  );

  svg.push(`</svg>`);
  return svg.join("\n");
}

// ─── Full Gantt Generator (detailed view) ────────────────────────────────────

const PADDING_X = 28;
const PADDING_TOP = 24;
const HEADER_HEIGHT = 50;
const AXIS_HEIGHT = 28;
const ROW_HEIGHT = 36;
const ROW_GAP = 2;
const BAR_HEIGHT = 12;
const LABEL_WIDTH = 150;
const MIN_BAR_WIDTH = 6;
const FOOTER_HEIGHT = 30;

function generateFullSVG(
  repos: ProcessedRepo[],
  username: string,
  theme: Theme
): string {
  const colors = THEMES[theme];

  if (repos.length === 0) {
    return generateEmptySVG(username, colors);
  }

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

  globalStart.setMonth(globalStart.getMonth() - 1);
  globalStart.setDate(1);
  globalEnd.setMonth(globalEnd.getMonth() + 2);
  globalEnd.setDate(1);

  const totalMonths = Math.max(1, getMonthsBetween(globalStart, globalEnd));

  // ── Dimensions ──
  const chartWidth = Math.max(360, Math.min(720, totalMonths * 16));
  const totalWidth = PADDING_X * 2 + LABEL_WIDTH + chartWidth + 80;
  const repoAreaHeight = sortedRepos.length * (ROW_HEIGHT + ROW_GAP);
  const totalHeight =
    PADDING_TOP + HEADER_HEIGHT + AXIS_HEIGHT + repoAreaHeight + FOOTER_HEIGHT;

  const chartX = PADDING_X + LABEL_WIDTH;
  const chartY = PADDING_TOP + HEADER_HEIGHT + AXIS_HEIGHT;

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

  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );

  // ── Defs ──
  svg.push(`<defs>`);
  svg.push(
    `<clipPath id="chart-clip"><rect x="${chartX}" y="${chartY - 2}" width="${chartWidth}" height="${repoAreaHeight + 4}"/></clipPath>`
  );

  sortedRepos.forEach((repo, i) => {
    const base = getLanguageColor(repo.primaryLanguage);
    const dark = darkenColor(base, 0.15);
    svg.push(
      `<linearGradient id="g${i}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${base}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>`
    );
  });

  svg.push(`<style>
    .f{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .row{animation:fadeIn .4s ease forwards}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
    .live{animation:blink 2s ease-in-out infinite}
  </style>`);
  svg.push(`</defs>`);

  // ── Background ──
  svg.push(
    `<rect width="${totalWidth}" height="${totalHeight}" rx="6" fill="${colors.background}"/>`
  );
  svg.push(
    `<rect x=".5" y=".5" width="${totalWidth - 1}" height="${totalHeight - 1}" rx="6" fill="none" stroke="${colors.border}" stroke-width="1"/>`
  );

  // ── Header ──
  const hY = PADDING_TOP + 16;
  svg.push(
    `<g transform="translate(${PADDING_X},${hY - 10}) scale(0.7)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="${colors.textSecondary}"/></g>`
  );
  svg.push(
    `<text x="${PADDING_X + 22}" y="${hY}" class="f" font-size="14" font-weight="600" fill="${colors.text}">${escapeXml(username)}</text>`
  );
  svg.push(
    `<text x="${PADDING_X + 22}" y="${hY + 16}" class="f" font-size="10" fill="${colors.textMuted}">Key Projects</text>`
  );

  const badgeLabel = `${sortedRepos.length} project${sortedRepos.length === 1 ? "" : "s"}`;
  const bW = badgeLabel.length * 6.5 + 14;
  const bX = totalWidth - PADDING_X - bW;
  svg.push(
    `<rect x="${bX}" y="${hY - 10}" width="${bW}" height="18" rx="9" fill="${colors.cardBackground}" stroke="${colors.border}" stroke-width="0.5"/>`
  );
  svg.push(
    `<text x="${bX + bW / 2}" y="${hY + 2}" class="f" font-size="10" fill="${colors.textSecondary}" text-anchor="middle">${badgeLabel}</text>`
  );

  // ── Year axis ──
  const axisY = PADDING_TOP + HEADER_HEIGHT;
  const startYear = globalStart.getFullYear();
  const endYear = globalEnd.getFullYear();

  svg.push(
    `<line x1="${chartX}" y1="${axisY + AXIS_HEIGHT - 1}" x2="${chartX + chartWidth}" y2="${axisY + AXIS_HEIGHT - 1}" stroke="${colors.border}" stroke-width=".5"/>`
  );

  for (let year = startYear; year <= endYear; year++) {
    const x = toX(new Date(year, 0, 1), globalStart, totalMonths, chartX, chartWidth);
    if (x >= chartX && x <= chartX + chartWidth) {
      svg.push(
        `<line x1="${x}" y1="${axisY + AXIS_HEIGHT}" x2="${x}" y2="${chartY + repoAreaHeight}" stroke="${colors.gridLine}" stroke-width=".5"/>`
      );
      svg.push(
        `<text x="${x}" y="${axisY + 12}" class="f" font-size="10" fill="${colors.yearText}" text-anchor="middle">${year}</text>`
      );
      svg.push(
        `<line x1="${x}" y1="${axisY + AXIS_HEIGHT - 4}" x2="${x}" y2="${axisY + AXIS_HEIGHT}" stroke="${colors.textMuted}" stroke-width=".5"/>`
      );
    }

    const midX = toX(new Date(year, 6, 1), globalStart, totalMonths, chartX, chartWidth);
    if (midX > chartX && midX < chartX + chartWidth) {
      svg.push(
        `<line x1="${midX}" y1="${axisY + AXIS_HEIGHT}" x2="${midX}" y2="${chartY + repoAreaHeight}" stroke="${colors.gridLine}" stroke-width=".3" stroke-dasharray="2,4"/>`
      );
    }
  }

  // ── Rows ──
  sortedRepos.forEach((repo, i) => {
    const rowY = chartY + i * (ROW_HEIGHT + ROW_GAP);
    const isLongest = i === longestIdx && sortedRepos.length > 1;
    const langColor = getLanguageColor(repo.primaryLanguage);
    const labelCenterY = rowY + ROW_HEIGHT / 2;

    if (i % 2 === 0) {
      svg.push(
        `<rect x="${PADDING_X + 1}" y="${rowY}" width="${totalWidth - PADDING_X * 2 - 2}" height="${ROW_HEIGHT}" fill="${colors.cardBackground}" opacity=".35" rx="3"/>`
      );
    }

    svg.push(
      `<circle cx="${PADDING_X + 8}" cy="${labelCenterY}" r="3.5" fill="${langColor}"/>`
    );

    const displayName = truncate(repo.name, 18);
    const nameColor = isLongest ? colors.titleText : colors.text;
    svg.push(
      `<text x="${PADDING_X + 18}" y="${labelCenterY + 4}" class="f" font-size="11" font-weight="500" fill="${nameColor}">${escapeXml(displayName)}</text>`
    );

    repo.segments.forEach((seg) => {
      let x1 = toX(seg.start, globalStart, totalMonths, chartX, chartWidth);
      let x2 = toX(seg.end, globalStart, totalMonths, chartX, chartWidth);

      x1 = Math.max(chartX, Math.min(x1, chartX + chartWidth));
      x2 = Math.max(chartX, Math.min(x2, chartX + chartWidth));

      let w = x2 - x1;
      if (w < MIN_BAR_WIDTH) w = MIN_BAR_WIDTH;
      if (x1 + w > chartX + chartWidth) w = chartX + chartWidth - x1;

      const barY = labelCenterY - BAR_HEIGHT / 2;
      svg.push(
        `<rect x="${x1}" y="${barY}" width="${w}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="url(#g${i})" opacity=".9"/>`
      );
    });

    if (repo.segments.length > 1) {
      const firstEnd = toX(repo.segments[0].end, globalStart, totalMonths, chartX, chartWidth);
      const lastStart = toX(
        repo.segments[repo.segments.length - 1].start,
        globalStart,
        totalMonths,
        chartX,
        chartWidth
      );
      svg.push(
        `<line x1="${firstEnd}" y1="${labelCenterY}" x2="${lastStart}" y2="${labelCenterY}" stroke="${langColor}" stroke-width="1" stroke-dasharray="3,3" opacity=".3"/>`
      );
    }

    const lastSegEnd = toX(repo.endDate, globalStart, totalMonths, chartX, chartWidth);
    const rightX = Math.min(lastSegEnd + 6, chartX + chartWidth + 6);
    const durStr = formatActiveDays(repo.activeDays);
    svg.push(
      `<text x="${rightX}" y="${labelCenterY + 3}" class="f" font-size="9" fill="${colors.textMuted}">Active: ${durStr}</text>`
    );

    if (repo.isOngoing) {
      const dotX = rightX + (`Active: ${durStr}`).length * 5 + 6;
      svg.push(
        `<circle cx="${dotX}" cy="${labelCenterY}" r="3" fill="${colors.ongoingBadge}" class="live"/>`
      );
    }

    // Complexity badge
    const complexColor = getComplexityColor(repo.complexityLabel, colors);
    const complexSymbol = getComplexitySymbol(repo.complexityLabel);
    if (repo.isOngoing) {
      const dotX = rightX + (`Active: ${durStr}`).length * 5 + 6;
      svg.push(
        `<text x="${dotX + 10}" y="${labelCenterY + 3}" class="f" font-size="8" fill="${complexColor}">${complexSymbol} ${repo.complexityLabel}</text>`
      );
    } else {
      svg.push(
        `<text x="${rightX + (`Active: ${durStr}`).length * 5 + 6}" y="${labelCenterY + 3}" class="f" font-size="8" fill="${complexColor}">${complexSymbol} ${repo.complexityLabel}</text>`
      );
    }

    if (isLongest) {
      svg.push(
        `<text x="${totalWidth - PADDING_X - 4}" y="${labelCenterY + 3}" class="f" font-size="9" fill="${colors.titleText}" text-anchor="end" opacity=".7">longest</text>`
      );
    }
  });

  // ── Footer ──
  svg.push(
    `<text x="${totalWidth / 2}" y="${totalHeight - 10}" class="f" font-size="9" fill="${colors.textMuted}" text-anchor="middle" opacity=".5">repopulse \u00B7 curated by quality</text>`
  );

  svg.push(`</svg>`);
  return svg.join("\n");
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateTimelineSVG(
  repos: ProcessedRepo[],
  username: string,
  theme: Theme = "dark",
  mode: Mode = "mini"
): string {
  if (mode === "full") {
    return generateFullSVG(repos, username, theme);
  }
  return generateMiniSVG(repos, username, theme);
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

export function generateErrorSVG(
  message: string,
  theme: Theme = "dark"
): string {
  const colors = THEMES[theme];
  const w = 420;
  const h = 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" rx="6" fill="${colors.background}" stroke="#DA3633" stroke-width="1"/>
<text x="${w / 2}" y="32" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12" fill="#DA3633" text-anchor="middle" font-weight="600">Error</text>
<text x="${w / 2}" y="52" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10" fill="${colors.textSecondary}" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}
