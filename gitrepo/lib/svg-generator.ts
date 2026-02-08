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

// ─── Mini Card Generator (Full Width Professional Analytics) ─────────────────

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
  const totalDays = sorted.reduce((s, r) => s + r.activeDays, 0);

  // Professional color palette
  const accent = theme === "dark" ? "#60A5FA" : "#3B82F6"; // Blue
  const accentSoft = theme === "dark" ? "rgba(96,165,250,0.08)" : "rgba(59,130,246,0.06)";
  const valueColor = theme === "dark" ? "#F8FAFC" : "#0F172A";
  const mutedColor = theme === "dark" ? "#64748B" : "#64748B";
  
  // Professional segment colors (muted, cohesive palette)
  const segmentColors = [
    theme === "dark" ? "#60A5FA" : "#3B82F6", // Blue
    theme === "dark" ? "#34D399" : "#10B981", // Emerald  
    theme === "dark" ? "#F472B6" : "#EC4899", // Pink
    theme === "dark" ? "#FBBF24" : "#F59E0B", // Amber
    theme === "dark" ? "#A78BFA" : "#8B5CF6", // Violet
    theme === "dark" ? "#FB7185" : "#EF4444", // Red
    theme === "dark" ? "#22D3EE" : "#06B6D4", // Cyan
    theme === "dark" ? "#4ADE80" : "#22C55E", // Green
  ];

  // ── Full Width Layout Configuration ──
  const maxProjects = Math.min(sorted.length, 8);
  const cardW = 600; // Increased for full width
  const padX = 20;
  const padY = 20;
  const headerH = 45;
  const footerH = 35;
  
  // Optimized circle - larger and more prominent
  const circleR = 90; // Even larger for better visibility
  const strokeW = 20; // Thicker segments
  const innerR = circleR - strokeW / 2;
  
  const chartAreaH = circleR * 2 + 50;
  const cardH = padY + headerH + chartAreaH + footerH + padY;

  // Circle positioned for optimal space usage
  const circleCX = padX + circleR + 20;
  const circleCY = padY + headerH + chartAreaH / 2;

  // Project list - single column with proper spacing
  const listStartX = circleCX + circleR + 40;
  const listWidth = cardW - listStartX - padX;

  const svg: string[] = [];
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">`
  );

  // ── Defs ──
  svg.push(`<defs>`);
  svg.push(`<style>`);
  svg.push(
    `.f{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}`
  );
  svg.push(
    `@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`
  );
  svg.push(`.item{animation:slideIn .5s ease-out forwards;opacity:0}`);
  for (let i = 0; i < maxProjects; i++) {
    svg.push(`.item-${i}{animation-delay:${250 + i * 80}ms}`);
  }
  svg.push(
    `@keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`
  );
  svg.push(
    `.center{animation:scaleIn .6s ease-out forwards;animation-delay:.2s;opacity:0;transform-origin:${circleCX}px ${circleCY}px}`
  );
  svg.push(`</style>`);

  // Enhanced professional gradients
  svg.push(
    `<radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accentSoft}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>`
  );
  
  // Segment gradients for depth
  segmentColors.forEach((color, i) => {
    svg.push(
      `<linearGradient id="segGrad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.7"/>
      </linearGradient>`
    );
  });
  
  // Enhanced shadow
  svg.push(
    `<filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${theme === 'dark' ? '#000000' : '#000000'}" flood-opacity="${theme === 'dark' ? '0.4' : '0.12'}"/>
    </filter>`
  );
  svg.push(`</defs>`);

  // ── Card Background ──
  svg.push(
    `<rect width="${cardW}" height="${cardH}" rx="10" fill="${colors.background}" filter="url(#cardShadow)"/>`
  );
  svg.push(
    `<rect x="1" y="1" width="${cardW - 2}" height="${cardH - 2}" rx="9" fill="none" stroke="${colors.border}" stroke-width="0.5" opacity="0.5"/>`
  );

  // ── Header ──
  const hY = padY + 18;
  svg.push(
    `<text x="${padX}" y="${hY}" class="f" font-size="16" fill="${valueColor}" font-weight="600" letter-spacing="-0.02em">${escapeXml(
      username
    )}</text>`
  );
  svg.push(
    `<text x="${padX}" y="${hY + 20}" class="f" font-size="11" fill="${mutedColor}" font-weight="500">Development Activity</text>`
  );
  
  // Header divider
  svg.push(
    `<line x1="${padX}" y1="${padY + headerH - 6}" x2="${
      cardW - padX
    }" y2="${padY + headerH - 6}" stroke="${
      colors.border
    }" stroke-width="0.5" opacity="0.25"/>`
  );

  // ── Enhanced Circle with Clear Segment Separation ──
  // Background track
  svg.push(
    `<circle cx="${circleCX}" cy="${circleCY}" r="${innerR}" fill="none" stroke="${colors.border}" stroke-width="${strokeW}" opacity="0.06"/>`
  );

  // Calculate segments with clear gaps
  let currentAngle = -Math.PI / 2; // Start at top
  const circumference = 2 * Math.PI * innerR;
  const gapAngle = 0.02; // 2% gap between segments
  const totalGaps = maxProjects * gapAngle;
  const availableAngle = 2 * Math.PI - totalGaps;

  for (let i = 0; i < maxProjects; i++) {
    const repo = sorted[i];
    const ratio = repo.activeDays / totalDays;
    
    // Calculate segment angle with gap consideration
    const segmentAngle = (ratio * availableAngle);
    const arcLength = (segmentAngle / (2 * Math.PI)) * circumference;
    const segmentColor = segmentColors[i % segmentColors.length];

    // Create arc path
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    
    const x1 = circleCX + innerR * Math.cos(startAngle);
    const y1 = circleCY + innerR * Math.sin(startAngle);
    const x2 = circleCX + innerR * Math.cos(endAngle);
    const y2 = circleCY + innerR * Math.sin(endAngle);

    const largeArc = segmentAngle > Math.PI ? 1 : 0;

    // Main segment with clear boundaries
    svg.push(
      `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" ` +
      `fill="none" stroke="${segmentColor}" stroke-width="${strokeW}" stroke-linecap="butt" ` +
      `stroke-dasharray="${arcLength.toFixed(2)} ${circumference.toFixed(2)}" ` +
      `stroke-dashoffset="${arcLength.toFixed(2)}" opacity="0.95">`
    );
    svg.push(
      `<animate attributeName="stroke-dashoffset" ` +
      `from="${arcLength.toFixed(2)}" to="0" ` +
      `dur="0.8s" fill="freeze" begin="${(0.2 + i * 0.1).toFixed(2)}s" ` +
      `calcMode="spline" keySplines="0.25 0 0.25 1"/>`
    );
    svg.push(`</path>`);

    // Move to next segment with gap
    currentAngle += segmentAngle + gapAngle;
  }

  // ── Enhanced Center Hub ──
  svg.push(`<g class="center">`);
  const centerR = innerR - strokeW / 2 - 15;
  
  // Multi-layer center design
  svg.push(
    `<circle cx="${circleCX}" cy="${circleCY}" r="${centerR + 8}" fill="url(#centerGrad)" opacity="0.8"/>`
  );
  svg.push(
    `<circle cx="${circleCX}" cy="${circleCY}" r="${centerR}" fill="${colors.background}" stroke="${colors.border}" stroke-width="0.5" opacity="0.2"/>`
  );
  
  // Large, prominent total time
  const totalStr = formatActiveDays(totalDays);
  svg.push(
    `<text x="${circleCX}" y="${
      circleCY - 8
    }" class="f" font-size="26" fill="${valueColor}" font-weight="700" text-anchor="middle" letter-spacing="-0.03em">${totalStr}</text>`
  );
  svg.push(
    `<text x="${circleCX}" y="${
      circleCY + 18
    }" class="f" font-size="11" fill="${mutedColor}" text-anchor="middle" font-weight="500" letter-spacing="1px" opacity="0.9">TOTAL ACTIVE</text>`
  );
  svg.push(`</g>`);

  // ── Project List (Properly Spaced Single Column) ──
  const itemH = 38; // Increased spacing even more
  const listStartY = circleCY - (maxProjects * itemH) / 2 + itemH / 2;

  for (let i = 0; i < maxProjects; i++) {
    const repo = sorted[i];
    const ly = listStartY + i * itemH;
    
    const segmentColor = segmentColors[i % segmentColors.length];
    const nameStr = truncate(repo.name, 16);
    const activeStr = formatActiveDays(repo.activeDays);
    const langStr = langAbbr(repo.primaryLanguage);  
    const percent = ((repo.activeDays / totalDays) * 100).toFixed(0);

    svg.push(`<g class="item item-${i}">`);

    // Enhanced color indicator with clear separation
    svg.push(
      `<rect x="${listStartX}" y="${ly - 7}" width="14" height="14" rx="3" fill="${segmentColor}" opacity="0.9"/>`
    );
    svg.push(
      `<rect x="${listStartX + 3}" y="${ly - 4}" width="8" height="8" rx="2" fill="${colors.background}" opacity="0.8"/>`
    );

    // Project name - larger and more readable  
    svg.push(
      `<text x="${
        listStartX + 22
      }" y="${ly + 2}" class="f" font-size="14" fill="${valueColor}" font-weight="600">${escapeXml(
        nameStr
      )}</text>`
    );

    // Duration (right-aligned)
    const durationX = cardW - padX;
    svg.push(
      `<text x="${durationX}" y="${
        ly + 2
      }" class="f" font-size="13" fill="${accent}" font-weight="600" text-anchor="end">${activeStr}</text>`
    );

    // Metadata line with better spacing
    svg.push(
      `<text x="${listStartX + 22}" y="${
        ly + 18
      }" class="f" font-size="11" fill="${mutedColor}" font-weight="500">${escapeXml(
        langStr
      )} • ${percent}%</text>`
    );

    svg.push(`</g>`);
  }

  // ── Enhanced Footer ──
  const footerDivY = padY + headerH + chartAreaH + 8;
  svg.push(
    `<line x1="${padX}" y1="${footerDivY}" x2="${
      cardW - padX
    }" y2="${footerDivY}" stroke="${
      colors.border
    }" stroke-width="0.5" opacity="0.25"/>`
  );

  const footerY = footerDivY + footerH / 2 + 2;
  
  // Footer content with better spacing
  svg.push(
    `<text x="${padX}" y="${footerY}" class="f" font-size="11" fill="${mutedColor}" font-weight="500">Total Development Time</text>`
  );
  svg.push(
    `<text x="${
      padX + 155
    }" y="${footerY}" class="f" font-size="13" fill="${accent}" font-weight="600">${formatActiveDays(totalDays)}</text>`
  );

  // Project count
  const projectsText =
    sorted.length > maxProjects
      ? `${sorted.length} projects (${maxProjects} shown)`
      : `${sorted.length} project${sorted.length === 1 ? '' : 's'}`;
  svg.push(
    `<text x="${
      cardW - padX
    }" y="${footerY}" class="f" font-size="10" fill="${mutedColor}" font-weight="500" text-anchor="end">${projectsText}</text>`
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
