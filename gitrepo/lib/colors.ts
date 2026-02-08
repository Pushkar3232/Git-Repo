// ─── Language → Color Mapping ──────────────────────────────────────────────
// Colors sourced from GitHub's linguist language colors

const LANGUAGE_COLORS: Record<string, string> = {
  // Web / Frontend
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  HTML: "#E34C26",
  CSS: "#563D7C",
  SCSS: "#C6538C",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Astro: "#FF5D01",

  // Backend
  Python: "#3572A5",
  Java: "#B07219",
  "C#": "#239120",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#CC342D",
  PHP: "#4F5D95",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Elixir: "#6E4A7E",
  Scala: "#DC322F",

  // Systems
  C: "#555555",
  "C++": "#F34B7D",
  "Objective-C": "#438EFF",
  Assembly: "#6E4C13",

  // Data / ML
  Jupyter: "#F37626",
  "Jupyter Notebook": "#DA5B0B",
  R: "#198CE7",
  Julia: "#9558B2",
  MATLAB: "#E16737",

  // Shell / Config
  Shell: "#89E051",
  PowerShell: "#012456",
  Dockerfile: "#384D54",
  Makefile: "#427819",
  Nix: "#7E7EFF",
  HCL: "#844FBA",

  // Mobile
  "Objective-C++": "#6866FB",

  // Other
  Lua: "#000080",
  Perl: "#0298C3",
  Haskell: "#5E5086",
  Clojure: "#DB5855",
  Erlang: "#B83998",
  Zig: "#EC915C",
  OCaml: "#3BE133",
  Nim: "#FFE953",
  V: "#4F87C4",
  Crystal: "#000100",
  "F#": "#B845FC",

  // Default
  Unknown: "#8B8B8B",
};

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? LANGUAGE_COLORS["Unknown"];
}

/**
 * Darken a hex color for stroke use
 */
export function darkenColor(hex: string, amount: number = 0.25): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Get a lighter version of a color for gradients
 */
export function lightenColor(hex: string, amount: number = 0.3): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.floor((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
